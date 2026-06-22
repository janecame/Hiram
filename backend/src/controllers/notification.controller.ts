import type { Request, Response } from 'express';
import { NotificationModel } from '../models/notification.model';

export const NotificationController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const notifications = await NotificationModel.findByRecipient(req.user!.id);
      res.status(200).json(notifications);
    } catch (err) {
      console.error('GET /api/notifications failed:', err);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  },

  async markRead(req: Request, res: Response): Promise<void> {
    try {
      await NotificationModel.markRead(req.params['id'] as string, req.user!.id);
      res.status(204).end();
    } catch (err) {
      console.error('PATCH /api/notifications/:id/read failed:', err);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  },

  async markAllRead(req: Request, res: Response): Promise<void> {
    try {
      await NotificationModel.markAllRead(req.user!.id);
      res.status(204).end();
    } catch (err) {
      console.error('PATCH /api/notifications/read-all failed:', err);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  },

  async unreadCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await NotificationModel.unreadCount(req.user!.id);
      res.status(200).json({ count });
    } catch (err) {
      console.error('GET /api/notifications/unread-count failed:', err);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  },
};
