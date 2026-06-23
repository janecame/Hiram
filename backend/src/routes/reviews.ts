import { Router } from "express";
import { ReviewController } from "../controllers/review.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, ReviewController.create);
router.get("/item/:itemId", ReviewController.findByItem);
router.get("/user/:userId", ReviewController.findByUser);

export default router;
