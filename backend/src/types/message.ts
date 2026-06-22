export interface Conversation {
  id: string;
  itemId: string;
  itemTitle: string;
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

export interface NewMessageInput {
  content: string;
}

export interface NewConversationInput {
  itemId: string;
  listerId: string;
}
