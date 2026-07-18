import { Router } from "express";
import express from "express";
import { PaymentController } from "../controllers/payment.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Raw body required here for webhook signature verification — must not pass through express.json().
router.post("/webhook", express.raw({ type: "application/json" }), PaymentController.webhook);

router.post("/checkout", express.json(), requireAuth, PaymentController.createCheckout);
router.get("/request/:requestId", express.json(), requireAuth, PaymentController.getStatus);
router.post("/cash", express.json(), requireAuth, PaymentController.createCash);
router.patch("/:id/confirm-cash", express.json(), requireAuth, PaymentController.confirmCash);

export default router;
