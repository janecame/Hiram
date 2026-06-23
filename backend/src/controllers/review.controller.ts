import type { Request, Response } from "express";
import { ReviewModel } from "../models/review.model";
import type { NewReviewInput } from "../types/review";

export const ReviewController = {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const reviewerId = req.user!.id;
      const review = await ReviewModel.create(
        req.body as NewReviewInput,
        reviewerId
      );
      res.status(201).json(review);
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 400 || status === 403 || status === 404 || status === 409) {
        res.status(status).json({ error: (err as Error).message });
        return;
      }
      console.error("POST /api/reviews failed:", err);
      res.status(500).json({ error: "Failed to create review" });
    }
  },

  async findByItem(req: Request, res: Response): Promise<void> {
    try {
      const reviews = await ReviewModel.findByItem(req.params["itemId"] as string);
      res.status(200).json(reviews);
    } catch (err) {
      console.error("GET /api/reviews/item/:itemId failed:", err);
      res.status(500).json({ error: "Failed to load reviews" });
    }
  },

  async findByUser(req: Request, res: Response): Promise<void> {
    try {
      const reviews = await ReviewModel.findByUser(req.params["userId"] as string);
      res.status(200).json(reviews);
    } catch (err) {
      console.error("GET /api/reviews/user/:userId failed:", err);
      res.status(500).json({ error: "Failed to load reviews" });
    }
  },
};
