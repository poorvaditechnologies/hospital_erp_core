import { Router } from "express";
import { z } from "zod";
import { VisitType, NotesVisibility } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as visitController from "../controllers/visit.controller";

const router = Router({ mergeParams: true });

const createVisitSchema = z.object({
  visitType: z.nativeEnum(VisitType),
  visitDate: z.string().datetime().optional(),
  complaint: z.string().optional(),
  diagnosis: z.string().optional(),
  prescriptionNotes: z.string().optional(),
  nextFollowUpDate: z.string().datetime().optional(),
  notesVisibility: z.nativeEnum(NotesVisibility).optional(),
  doctorId: z.string().optional(),
});

router.use(requireAuth);

router.get("/", visitController.list);
router.post("/", validateBody(createVisitSchema), visitController.create);

export default router;

export const updateVisitSchema = z.object({
  complaint: z.string().optional(),
  diagnosis: z.string().optional(),
  prescriptionNotes: z.string().optional(),
  nextFollowUpDate: z.string().datetime().optional(),
  notesVisibility: z.nativeEnum(NotesVisibility).optional(),
});
