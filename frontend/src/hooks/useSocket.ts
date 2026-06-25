import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from '../auth/AuthContext';
import type { Message } from '../types/message';
import { API_BASE } from '../api/_base';

const BACKEND_URL = API_BASE || window.location.origin;

let socketInstance: Socket | null = null;

export function useSocket(): Socket | null {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      socketInstance?.disconnect();
      socketInstance = null;
      socketRef.current = null;
      return;
    }

    const token = localStorage.getItem('hiram_token');
    if (!token) return;

    if (!socketInstance) {
      socketInstance = io(BACKEND_URL, { auth: { token } });
    }
    socketRef.current = socketInstance;

    socketInstance.on('notification', () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socketInstance.on('chat:message', (message: Message) => {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations', 'unread'] });
    });

    return () => {
      socketInstance?.off('notification');
      socketInstance?.off('chat:message');
    };
  }, [isAuthenticated, queryClient]);

  return socketRef.current;
}
