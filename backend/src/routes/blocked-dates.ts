import { Router } from "express";
import { BlockedDateController } from "../controllers/blocked-date.controller";
import { requireAuth } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.get("/:id/blocked-dates", BlockedDateController.list);
router.post("/:id/blocked-dates", requireAuth, BlockedDateController.add);
router.delete("/:id/blocked-dates/:date", requireAuth, BlockedDateController.remove);

export default router;
