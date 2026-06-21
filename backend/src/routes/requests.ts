import { Router } from "express";
import { RequestController } from "../controllers/request.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, RequestController.create);
router.get("/", requireAuth, RequestController.list);
router.patch("/:id/status", requireAuth, RequestController.updateStatus);

export default router;
