import type { Notification } from '../types/notification';
import { authFetch } from './_base';

export async function getNotifications(opts?: { limit?: number }): Promise<Notification[]> {
  const params = opts?.limit ? `?limit=${opts.limit}` : '';
  const res = await authFetch(`/api/notifications${params}`);
  if (res.status === 401) throw new Error('Authentication required');
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json() as Promise<Notification[]>;
}

export async function getUnreadCount(): Promise<number> {
  const res = await authFetch('/api/notifications/unread-count');
  if (res.status === 401) throw new Error('Authentication required');
  if (!res.ok) throw new Error('Failed to get unread count');
  const data = (await res.json()) as { count: number };
  return data.count;
}

export async function markRead(id: string): Promise<void> {
  const res = await authFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  if (res.status === 401) throw new Error('Authentication required');
  if (!res.ok) throw new Error('Failed to mark notification as read');
}

export async function markAllRead(): Promise<void> {
  const res = await authFetch('/api/notifications/read-all', { method: 'PATCH' });
  if (res.status === 401) throw new Error('Authentication required');
  if (!res.ok) throw new Error('Failed to mark all notifications as read');
}
