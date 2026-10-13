import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as clinicController from "../controllers/clinic.controller";

const router = Router();

const updateClinicSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(6).optional(),
  address: z.string().optional(),
});

router.use(requireAuth);

router.get("/", clinicController.getOne);
router.patch("/", requireRole("ADMIN"), validateBody(updateClinicSchema), clinicController.update);

export default router;
