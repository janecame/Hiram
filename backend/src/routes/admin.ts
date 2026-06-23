import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { AdminController } from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", AdminController.getStats);
router.get("/users", AdminController.listUsers);
router.delete("/users/:id", AdminController.deleteUser);
router.get("/items", AdminController.listItems);
router.delete("/items/:id", AdminController.deleteItem);

export default router;
