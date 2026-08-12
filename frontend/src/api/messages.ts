import type { Conversation, Message } from '../types/message';
import { authFetch } from './_base';

export async function getConversations(): Promise<Conversation[]> {
  const res = await authFetch('/api/conversations');
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json() as Promise<Conversation[]>;
}

export async function createConversation(listerId: string, itemId?: string | null): Promise<Conversation> {
  const res = await authFetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listerId, itemId: itemId ?? null }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json() as Promise<Conversation>;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const res = await authFetch(`/api/conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json() as Promise<Message[]>;
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const res = await authFetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json() as Promise<Message>;
}

export async function getUnreadMessageCount(): Promise<number> {
  const res = await authFetch('/api/conversations/unread-count');
  if (!res.ok) throw new Error('Failed to get unread count');
  const data = (await res.json()) as { count: number };
  return data.count;
}
