import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotifications, getUnreadCount, markAllRead, markRead } from '../api/notifications';
import { useAuth } from '../auth/AuthContext';

export function useNotifications(opts?: { limit?: number }) {
  const { isAuthenticated } = useAuth();
  const limit = opts?.limit;
  return useQuery({
    queryKey: limit ? ['notifications', 'all'] : ['notifications'],
    queryFn: () => getNotifications(limit ? { limit } : undefined),
    enabled: isAuthenticated,
  });
}

export function useUnreadCount() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: getUnreadCount,
    enabled: isAuthenticated,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
