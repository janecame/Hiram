import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { AdminController } from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", AdminController.getStats);
router.get("/users", AdminController.listUsers);
router.patch("/users/:id/verification", AdminController.setUserVerification);
router.patch("/users/:id/disable", AdminController.setUserDisabled);
router.delete("/users/:id", AdminController.deleteUser);
router.get("/items", AdminController.listItems);
router.patch("/items/:id/disable", AdminController.setItemDisabled);
router.delete("/items/:id", AdminController.deleteItem);

export default router;
