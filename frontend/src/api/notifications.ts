import type { Notification } from '../types/notification';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('hiram_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getNotifications(opts?: { limit?: number }): Promise<Notification[]> {
  const params = opts?.limit ? `?limit=${opts.limit}` : '';
  const res = await fetch(`/api/notifications${params}`, { headers: authHeaders() });
  if (res.status === 401) throw new Error('Authentication required');
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json() as Promise<Notification[]>;
}

export async function getUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications/unread-count', { headers: authHeaders() });
  if (res.status === 401) throw new Error('Authentication required');
  if (!res.ok) throw new Error('Failed to get unread count');
  const data = (await res.json()) as { count: number };
  return data.count;
}

export async function markRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('Authentication required');
  if (!res.ok) throw new Error('Failed to mark notification as read');
}

export async function markAllRead(): Promise<void> {
  const res = await fetch('/api/notifications/read-all', {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (res.status === 401) throw new Error('Authentication required');
  if (!res.ok) throw new Error('Failed to mark all notifications as read');
}
