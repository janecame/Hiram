import { Router } from "express";
import { ItemController } from "../controllers/item.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", ItemController.list);
router.get("/suggestions", ItemController.suggestions);
router.get("/:id", ItemController.detail);
router.post("/", requireAuth, ItemController.create);
router.patch("/:id", requireAuth, ItemController.update);
router.patch("/:id/archive", requireAuth, ItemController.setArchive);
router.delete("/:id", requireAuth, ItemController.remove);

export default router;
