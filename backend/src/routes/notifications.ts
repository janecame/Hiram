import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, NotificationController.list);
router.get('/unread-count', requireAuth, NotificationController.unreadCount);
router.patch('/read-all', requireAuth, NotificationController.markAllRead);
router.patch('/:id/read', requireAuth, NotificationController.markRead);

export default router;
