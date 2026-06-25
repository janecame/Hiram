import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// PUT must come before GET /:name so "me" isn't captured as a name param
router.put("/me", requireAuth, UserController.updateMe);
router.post("/me/id", requireAuth, UserController.submitId);
router.get("/:name", UserController.getByName);

export default router;
