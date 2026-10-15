import { z } from "zod";
import { VisitType, NotesVisibility } from "@prisma/client";

export const createVisitSchema = z.object({
  visitType: z.nativeEnum(VisitType),
  visitDate: z.string().datetime().optional(),
  complaint: z.string().optional(),
  diagnosis: z.string().optional(),
  prescriptionNotes: z.string().optional(),
  nextFollowUpDate: z.string().datetime().optional(),
  notesVisibility: z.nativeEnum(NotesVisibility).optional(),
  doctorId: z.string().optional(),
});

export const updateVisitSchema = z.object({
  complaint: z.string().optional(),
  diagnosis: z.string().optional(),
  prescriptionNotes: z.string().optional(),
  nextFollowUpDate: z.string().datetime().optional(),
  notesVisibility: z.nativeEnum(NotesVisibility).optional(),
});
