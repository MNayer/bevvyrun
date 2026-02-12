import { useState, useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Order, OrderStatus, WebRTCMessage } from '../types';

interface UseWebRTCReturn {
  orders: Order[];
  isHost: boolean;
  isConnected: boolean;
  peerId: string | null;
  connectionCount: number;
  addOrder: (data: { userName: string; userEmail: string; itemName: string; price: number }) => void;
  deleteOrder: (id: string) => void;
  updateStatus: (id: string, status: OrderStatus) => void;
  markAllPendingAsOrdered: () => void;
}

export const useWebRTC = (): UseWebRTCReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  
  // Ref to hold the Peer instance
  const peerRef = useRef<Peer | null>(null);
  // Ref to hold connections (as Host)
  const connectionsRef = useRef<DataConnection[]>([]);
  // Ref to hold connection to host (as Guest)
  const hostConnectionRef = useRef<DataConnection | null>(null);
  
  // Check URL for session ID
  const urlParams = new URLSearchParams(window.location.search);
  const hostIdFromUrl = urlParams.get('session');
  const isHost = !hostIdFromUrl;

  // Initialize Orders from LocalStorage if Host
  useEffect(() => {
    if (isHost) {
      try {
        const saved = localStorage.getItem('bevvy_orders');
        if (saved) setOrders(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load orders", e);
      }
    }
  }, [isHost]);

  // Persist Orders if Host
  useEffect(() => {
    if (isHost) {
      localStorage.setItem('bevvy_orders', JSON.stringify(orders));
      // Broadcast to all connected peers whenever state changes
      broadcast({ type: 'SYNC_STATE', payload: orders });
    }
  }, [orders, isHost]);

  // Initialize Peer
  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('My Peer ID is: ' + id);
      setPeerId(id);
      setIsConnected(true);

      if (!isHost && hostIdFromUrl) {
        connectToHost(hostIdFromUrl);
      }
    });

    peer.on('connection', (conn) => {
      if (isHost) {
        handleIncomingConnection(conn);
      } else {
        // Guests shouldn't really receive connections in this simple model, 
        // but if they do, we ignore or close.
        conn.close();
      }
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setIsConnected(false);
    });

    return () => {
      peer.destroy();
    };
  }, [isHost, hostIdFromUrl]);

  const handleIncomingConnection = (conn: DataConnection) => {
    connectionsRef.current.push(conn);
    setConnectionCount(prev => prev + 1);

    conn.on('open', () => {
      // Send current state immediately
      conn.send({ type: 'SYNC_STATE', payload: orders } as WebRTCMessage);
    });

    conn.on('data', (data) => {
      const msg = data as WebRTCMessage;
      handleMessageAsHost(msg);
    });

    conn.on('close', () => {
      connectionsRef.current = connectionsRef.current.filter(c => c !== conn);
      setConnectionCount(prev => prev - 1);
    });
  };

  const connectToHost = (hostId: string) => {
    if (!peerRef.current) return;
    const conn = peerRef.current.connect(hostId);
    hostConnectionRef.current = conn;

    conn.on('open', () => {
      setIsConnected(true);
    });

    conn.on('data', (data) => {
      const msg = data as WebRTCMessage;
      if (msg.type === 'SYNC_STATE') {
        setOrders(msg.payload);
      }
    });

    conn.on('close', () => {
      setIsConnected(false);
      alert('Disconnected from session host.');
    });
  };

  const broadcast = (msg: WebRTCMessage) => {
    if (!isHost) return;
    connectionsRef.current.forEach(conn => {
      if (conn.open) conn.send(msg);
    });
  };

  const handleMessageAsHost = (msg: WebRTCMessage) => {
    switch (msg.type) {
      case 'ADD_ORDER':
        setOrders(prev => [msg.payload, ...prev]);
        break;
      case 'DELETE_ORDER':
        setOrders(prev => prev.filter(o => o.id !== msg.payload));
        break;
      case 'UPDATE_STATUS':
        setOrders(prev => prev.map(o => o.id === msg.payload.id ? { ...o, status: msg.payload.status } : o));
        break;
      case 'LOCK_ALL':
        setOrders(prev => prev.map(o => o.status === OrderStatus.PENDING ? { ...o, status: OrderStatus.ORDERED } : o));
        break;
    }
    // The useEffect [orders] will handle the broadcast
  };

  // --- Public Actions ---

  const addOrder = (data: { userName: string; userEmail: string; itemName: string; price: number }) => {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      ...data,
      status: OrderStatus.PENDING,
      createdAt: Date.now()
    };

    if (isHost) {
      setOrders(prev => [newOrder, ...prev]);
    } else {
      hostConnectionRef.current?.send({ type: 'ADD_ORDER', payload: newOrder } as WebRTCMessage);
    }
  };

  const deleteOrder = (id: string) => {
    if (isHost) {
      setOrders(prev => prev.filter(o => o.id !== id));
    } else {
      hostConnectionRef.current?.send({ type: 'DELETE_ORDER', payload: id } as WebRTCMessage);
    }
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    if (isHost) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } else {
      hostConnectionRef.current?.send({ type: 'UPDATE_STATUS', payload: { id, status } } as WebRTCMessage);
    }
  };

  const markAllPendingAsOrdered = () => {
    if (isHost) {
        setOrders(prev => prev.map(o => o.status === OrderStatus.PENDING ? { ...o, status: OrderStatus.ORDERED } : o));
    } else {
        hostConnectionRef.current?.send({ type: 'LOCK_ALL' } as WebRTCMessage);
    }
  };

  return {
    orders,
    isHost,
    isConnected,
    peerId,
    connectionCount,
    addOrder,
    deleteOrder,
    updateStatus,
    markAllPendingAsOrdered
  };
};
