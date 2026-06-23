import { Router } from "express";
import { UploadController } from "../controllers/upload.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/presign", requireAuth, UploadController.presign);

export default router;
