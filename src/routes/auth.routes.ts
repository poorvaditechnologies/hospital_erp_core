import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import * as authController from "../controllers/auth.controller";

const router = Router();

const loginSchema = z.object({
  phone: z.string().min(6),
  password: z.string().min(1),
});

router.post("/login", validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);

export default router;
