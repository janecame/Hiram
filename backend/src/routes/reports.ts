import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { ReportController } from "../controllers/report.controller";

const router = Router();

router.post("/", requireAuth, (req, res) => void ReportController.create(req, res));
router.get("/mine", requireAuth, (req, res) => void ReportController.myList(req, res));
router.get("/request/:requestId", requireAuth, (req, res) => void ReportController.listByRequest(req, res));

router.get("/admin", requireAuth, requireAdmin, (req, res) => void ReportController.adminList(req, res));
router.patch("/admin/:id/status", requireAuth, requireAdmin, (req, res) => void ReportController.adminSetStatus(req, res));

export default router;
