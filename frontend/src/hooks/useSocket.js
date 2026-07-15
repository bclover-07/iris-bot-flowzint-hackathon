'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '@/lib/constants';

export function useSocket(sessionId) {
  const socketRef = useRef(null);
  const [routingEvents, setRoutingEvents] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const savedEvents = sessionStorage.getItem(`iris_routing_events_${sessionId}`);
    if (savedEvents) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { setRoutingEvents(JSON.parse(savedEvents)); } catch (e) {}
    }
  }, [sessionId]);

  useEffect(() => {
    if (routingEvents.length > 0 && sessionId) {
      sessionStorage.setItem(`iris_routing_events_${sessionId}`, JSON.stringify(routingEvents));
    }
  }, [routingEvents, sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const socket = io(API_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-session', sessionId);
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('routing-event', (data) => {
      setRoutingEvents(prev => [data, ...prev].slice(0, 50));
    });

    socket.on('budget-update', (data) => {
      setRoutingEvents(prev => [{ type: 'budget_update', ...data }, ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  const clearEvents = useCallback(() => setRoutingEvents([]), []);

  // eslint-disable-next-line react-hooks/refs
  return { socket: socketRef.current, routingEvents, isConnected, clearEvents };
}
