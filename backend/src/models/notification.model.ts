import { pool } from '../db';
import type { Notification, NotificationType } from '../types/notification';

function rowToNotification(row: Record<string, unknown>): Notification {
  return {
    id: row['id'] as string,
    recipientId: row['recipient_id'] as string,
    type: row['type'] as NotificationType,
    message: row['message'] as string,
    read: row['read'] as boolean,
    requestId: (row['request_id'] as string | null) ?? undefined,
    createdAt:
      row['created_at'] instanceof Date
        ? (row['created_at'] as Date).toISOString()
        : (row['created_at'] as string),
  };
}

export const NotificationModel = {
  async create(
    recipientId: string,
    type: NotificationType,
    message: string,
    requestId?: string
  ): Promise<Notification> {
    const result = await pool.query(
      `INSERT INTO notifications (recipient_id, type, message, request_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [recipientId, type, message, requestId ?? null]
    );
    return rowToNotification(result.rows[0] as Record<string, unknown>);
  },

  async findByRecipient(userId: string): Promise<Notification[]> {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE recipient_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );
    return result.rows.map((row) => rowToNotification(row as Record<string, unknown>));
  },

  async markRead(id: string, userId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications SET read = true
       WHERE id = $1 AND recipient_id = $2`,
      [id, userId]
    );
  },

  async markAllRead(userId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications SET read = true
       WHERE recipient_id = $1 AND read = false`,
      [userId]
    );
  },

  async unreadCount(userId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) FROM notifications
       WHERE recipient_id = $1 AND read = false`,
      [userId]
    );
    return parseInt(
      (result.rows[0] as Record<string, unknown>)['count'] as string,
      10
    );
  },
};
