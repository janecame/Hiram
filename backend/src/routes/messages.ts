import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { MessageController } from "../controllers/message.controller";

const router = Router();

router.use(requireAuth);

router.get("/", MessageController.listConversations);
router.post("/", MessageController.findOrCreate);
router.get("/unread-count", MessageController.getUnreadCount);
router.get("/:id/messages", MessageController.getMessages);
router.post("/:id/messages", MessageController.sendMessage);

export default router;
