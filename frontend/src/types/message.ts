export interface Conversation {
  id: string;
  itemId: string | null;
  itemTitle: string | null;
  borrowerId: string;
  borrowerName: string;
  listerId: string;
  listerName: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  read: boolean;
  createdAt: string;
}
