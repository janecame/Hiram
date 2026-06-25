import { Router } from "express";
import { RequestController } from "../controllers/request.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, RequestController.create);
router.get("/", requireAuth, RequestController.list);
router.patch("/:id/status", requireAuth, RequestController.updateStatus);
router.patch("/:id/counter", requireAuth, RequestController.counterOffer);
router.patch("/:id/counter-response", requireAuth, RequestController.respondToCounter);

export default router;
