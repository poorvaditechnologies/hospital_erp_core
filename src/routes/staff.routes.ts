import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as staffController from "../controllers/staff.controller";

const router = Router();

const createStaffSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(6, "Phone number is required"),
  email: z.string().email().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(UserRole),
});

const updateStaffSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().optional(),
});

const updateRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

const setActiveSchema = z.object({
  isActive: z.boolean(),
});

router.use(requireAuth, requireRole("ADMIN"));

router.get("/", staffController.list);
router.post("/", validateBody(createStaffSchema), staffController.create);
router.patch("/:id", validateBody(updateStaffSchema), staffController.update);
router.patch("/:id/role", validateBody(updateRoleSchema), staffController.updateRole);
router.patch("/:id/active", validateBody(setActiveSchema), staffController.setActive);

export default router;
