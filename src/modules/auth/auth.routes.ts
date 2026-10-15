import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { parseFormData } from "../../middleware/formData";
import * as authController from "./auth.controller";

const router = Router();

const loginSchema = z.object({
  phone: z.string().min(6),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  phone: z.string().min(6),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

router.post("/login", parseFormData, validateBody(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.me);
router.post(
  "/forgot-password",
  parseFormData,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  parseFormData,
  validateBody(resetPasswordSchema),
  authController.resetPassword,
);

export default router;
