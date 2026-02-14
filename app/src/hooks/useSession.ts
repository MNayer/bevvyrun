import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface OrderItem {
    id: string; // db id
    itemName: string;
    price: number;
}

export interface UserOrder {
    id: string;
    sessionId: string;
    userName: string;
    userEmail: string;
    totalAmount: number;
    isPaid: number;
    items: OrderItem[];
    createdAt: number;
}

export interface SessionData {
    id: string;
    name: string;
    hostId: string;
    createdAt: number;
    status: string;
    userOrders: UserOrder[];
}

export function useSession(sessionId: string) {
    const [session, setSession] = useState<SessionData | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isHost, setIsHost] = useState(false);

    // Check if current user is host
    useEffect(() => {
        if (session) {
            const storedHostId = localStorage.getItem(`session_host_${session.id}`);
            setIsHost(storedHostId === session.hostId);
        }
    }, [session]);

    const fetchSession = useCallback(async () => {
        try {
            const res = await fetch(`/api/sessions/${sessionId}`);
            if (!res.ok) throw new Error('Session not found');
            const data = await res.json();
            setSession(data);
        } catch (err) {
            console.error('Failed to fetch session:', err);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchSession();

        const newSocket = io();
        setSocket(newSocket);

        newSocket.emit('join_session', sessionId);

        newSocket.on('order_added', (newOrder: UserOrder) => {
            setSession(prev => {
                if (!prev) return null;
                return { ...prev, userOrders: [newOrder, ...prev.userOrders] };
            });
        });

        newSocket.on('order_paid', ({ orderId }) => {
            setSession(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    userOrders: prev.userOrders.map(o => o.id === orderId ? { ...o, isPaid: 1 } : o)
                };
            });
        });

        newSocket.on('session_locked', () => {
            setSession(prev => {
                if (!prev) return null;
                return { ...prev, status: 'LOCKED' };
            });
            alert("The host has locked the session!");
        });

        return () => {
            newSocket.disconnect();
        };
    }, [sessionId, fetchSession]);

    const submitOrder = useCallback(async (userName: string, userEmail: string, items: { itemName: string, price: number }[]) => {
        try {
            await fetch(`/api/sessions/${sessionId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName, userEmail, items }),
            });
        } catch (err) {
            console.error('Failed to submit order:', err);
            throw err;
        }
    }, [sessionId]);

    const lockSession = useCallback(async (template: string) => {
        if (!session) return;
        const storedHostId = localStorage.getItem(`session_host_${session.id}`);
        if (!storedHostId) return;

        try {
            await fetch(`/api/sessions/${sessionId}/lock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Host-ID': storedHostId
                },
                body: JSON.stringify({ template })
            });
        } catch (err) {
            console.error("Failed to lock session", err);
            throw err;
        }
    }, [sessionId, session]);

    return { session, isHost, submitOrder, lockSession };
}
