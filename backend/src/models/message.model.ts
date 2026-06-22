import { pool } from '../db';
import type { Conversation, Message } from '../types/message';

function rowToConversation(row: Record<string, unknown>): Conversation {
  return {
    id: row['id'] as string,
    itemId: row['item_id'] as string,
    itemTitle: row['item_title'] as string,
    borrowerId: row['borrower_id'] as string,
    borrowerName: row['borrower_name'] as string,
    listerId: row['lister_id'] as string,
    listerName: row['lister_name'] as string,
    lastMessage: (row['last_message'] as string | null) ?? undefined,
    lastMessageAt: row['last_message_at']
      ? (row['last_message_at'] instanceof Date
          ? (row['last_message_at'] as Date).toISOString()
          : (row['last_message_at'] as string))
      : undefined,
    unreadCount: parseInt(row['unread_count'] as string, 10),
    createdAt:
      row['created_at'] instanceof Date
        ? (row['created_at'] as Date).toISOString()
        : (row['created_at'] as string),
  };
}

function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row['id'] as string,
    conversationId: row['conversation_id'] as string,
    senderId: row['sender_id'] as string,
    senderName: row['sender_name'] as string,
    content: row['content'] as string,
    read: row['read'] as boolean,
    createdAt:
      row['created_at'] instanceof Date
        ? (row['created_at'] as Date).toISOString()
        : (row['created_at'] as string),
  };
}

export const MessageModel = {
  async findOrCreateConversation(
    itemId: string,
    borrowerId: string,
    listerId: string
  ): Promise<Conversation> {
    await pool.query(
      `INSERT INTO conversations (item_id, borrower_id, lister_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (item_id, borrower_id, lister_id) DO NOTHING`,
      [itemId, borrowerId, listerId]
    );

    const result = await pool.query(
      `SELECT
         c.id, c.item_id, c.borrower_id, c.lister_id, c.created_at,
         i.title AS item_title,
         bu.name AS borrower_name,
         lu.name AS lister_name,
         (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
         (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $2 AND read = false) AS unread_count
       FROM conversations c
       JOIN items i ON i.id = c.item_id
       JOIN users bu ON bu.id = c.borrower_id
       JOIN users lu ON lu.id = c.lister_id
       WHERE c.item_id = $1 AND c.borrower_id = $2 AND c.lister_id = $3`,
      [itemId, borrowerId, listerId]
    );

    return rowToConversation(result.rows[0] as Record<string, unknown>);
  },

  async listConversations(userId: string): Promise<Conversation[]> {
    const result = await pool.query(
      `SELECT
         c.id, c.item_id, c.borrower_id, c.lister_id, c.created_at,
         i.title AS item_title,
         bu.name AS borrower_name,
         lu.name AS lister_name,
         (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
         (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $1 AND read = false) AS unread_count
       FROM conversations c
       JOIN items i ON i.id = c.item_id
       JOIN users bu ON bu.id = c.borrower_id
       JOIN users lu ON lu.id = c.lister_id
       WHERE c.borrower_id = $1 OR c.lister_id = $1
       ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => rowToConversation(row as Record<string, unknown>));
  },

  async getMessages(conversationId: string, userId: string): Promise<Message[]> {
    // Mark messages from other party as read
    await pool.query(
      `UPDATE messages SET read = true
       WHERE conversation_id = $1 AND sender_id != $2 AND read = false`,
      [conversationId, userId]
    );

    const result = await pool.query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.read, m.created_at,
              u.name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    return result.rows.map((row) => rowToMessage(row as Record<string, unknown>));
  },

  async createMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<Message> {
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, conversation_id, sender_id, content, read, created_at`,
      [conversationId, senderId, content]
    );
    const row = result.rows[0] as Record<string, unknown>;

    const userResult = await pool.query(
      `SELECT name FROM users WHERE id = $1`,
      [senderId]
    );
    const senderName = (userResult.rows[0] as Record<string, unknown>)['name'] as string;

    return rowToMessage({ ...row, sender_name: senderName });
  },

  async getConversationById(conversationId: string, userId: string): Promise<Conversation | null> {
    const result = await pool.query(
      `SELECT
         c.id, c.item_id, c.borrower_id, c.lister_id, c.created_at,
         i.title AS item_title,
         bu.name AS borrower_name,
         lu.name AS lister_name,
         (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
         (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != $2 AND read = false) AS unread_count
       FROM conversations c
       JOIN items i ON i.id = c.item_id
       JOIN users bu ON bu.id = c.borrower_id
       JOIN users lu ON lu.id = c.lister_id
       WHERE c.id = $1 AND (c.borrower_id = $2 OR c.lister_id = $2)`,
      [conversationId, userId]
    );

    if (result.rows.length === 0) return null;
    return rowToConversation(result.rows[0] as Record<string, unknown>);
  },

  async totalUnreadCount(userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE (c.borrower_id = $1 OR c.lister_id = $1)
         AND m.sender_id != $1
         AND m.read = false`,
      [userId]
    );
    return parseInt((result.rows[0] as Record<string, unknown>)['count'] as string, 10);
  },
};
