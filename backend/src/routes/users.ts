import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// PUT must come before GET /:name so "me" isn't captured as a name param
router.put("/me", requireAuth, UserController.updateMe);
router.post("/me/accept-terms", requireAuth, UserController.acceptTerms);
router.post("/me/id", requireAuth, UserController.submitId);
router.post("/me/avatar", requireAuth, UserController.updateAvatar);
router.get("/search", UserController.search);
router.get("/:name", UserController.getByName);

export default router;
