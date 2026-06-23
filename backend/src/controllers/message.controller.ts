import type { Request, Response } from "express";
import { MessageModel } from "../models/message.model";
import { emitToUser } from "../socket";
import type { NewConversationInput, NewMessageInput } from "../types/message";

export const MessageController = {
  async listConversations(req: Request, res: Response): Promise<void> {
    try {
      const conversations = await MessageModel.listConversations(req.user!.id);
      res.json(conversations);
    } catch (err) {
      console.error("GET /api/conversations failed:", err);
      res.status(500).json({ error: "Failed to load conversations" });
    }
  },

  async findOrCreate(req: Request, res: Response): Promise<void> {
    try {
      const { itemId = null, listerId } = req.body as NewConversationInput;
      const borrowerId = req.user!.id;
      const conversation = await MessageModel.findOrCreateConversation(itemId ?? null, borrowerId, listerId);
      res.status(201).json(conversation);
    } catch (err) {
      console.error("POST /api/conversations failed:", err);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  },

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const conversationId = req.params["id"] as string;
      const conversation = await MessageModel.getConversationById(conversationId, req.user!.id);
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }
      const messages = await MessageModel.getMessages(conversationId, req.user!.id);
      res.json(messages);
    } catch (err) {
      console.error("GET /api/conversations/:id/messages failed:", err);
      res.status(500).json({ error: "Failed to load messages" });
    }
  },

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const conversationId = req.params["id"] as string;
      const senderId = req.user!.id;
      const { content } = req.body as NewMessageInput;

      const conversation = await MessageModel.getConversationById(conversationId, senderId);
      if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
      }

      const message = await MessageModel.createMessage(conversationId, senderId, content);

      const recipientId =
        conversation.borrowerId === senderId ? conversation.listerId : conversation.borrowerId;
      emitToUser(recipientId, "chat:message", message);

      res.status(201).json(message);
    } catch (err) {
      console.error("POST /api/conversations/:id/messages failed:", err);
      res.status(500).json({ error: "Failed to send message" });
    }
  },

  async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await MessageModel.totalUnreadCount(req.user!.id);
      res.json({ count });
    } catch (err) {
      console.error("GET /api/conversations/unread-count failed:", err);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  },
};
