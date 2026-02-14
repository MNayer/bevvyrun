import { useState, useEffect, useCallback } from 'react';

export interface SessionSummary {
    id: string;
    name: string;
    hostId: string;
    createdAt: number;
    status: string;
    totalItems: number;
    paidItems: number;
}

export function useSessions() {
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = useCallback(async () => {
        try {
            const res = await fetch('/api/sessions');
            const data = await res.json();
            setSessions(data);
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createSession = useCallback(async (name: string) => {
        try {
            const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const data = await res.json();
            // Store host ID in local storage
            localStorage.setItem(`session_host_${data.id}`, data.hostId);
            return data;
        } catch (err) {
            console.error('Failed to create session:', err);
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 5000); // Poll for updates every 5s for simple overview
        return () => clearInterval(interval);
    }, [fetchSessions]);

    return { sessions, loading, createSession, refresh: fetchSessions };
}
