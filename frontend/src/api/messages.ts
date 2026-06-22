import type { Conversation, Message } from '../types/message';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('hiram_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await fetch('/api/conversations', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json() as Promise<Conversation[]>;
}

export async function createConversation(itemId: string, listerId: string): Promise<Conversation> {
  const res = await fetch('/api/conversations', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ itemId, listerId }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json() as Promise<Conversation>;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json() as Promise<Message[]>;
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const res = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json() as Promise<Message>;
}

export async function getUnreadMessageCount(): Promise<number> {
  const res = await fetch('/api/conversations/unread-count', { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to get unread count');
  const data = (await res.json()) as { count: number };
  return data.count;
}
