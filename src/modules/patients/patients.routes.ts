import { Router } from "express";
import { z } from "zod";
import { Gender } from "@prisma/client";
import { requireAuth } from "../../middleware/auth";
import { validateBody, validateQuery } from "../../middleware/validate";
import { parseFormData } from "../../middleware/formData";
import * as patientController from "./patient.controller";
import visitRoutes from "./patients.visits.routes";

const router = Router();

const createPatientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(6, "Phone number is required"),
  dob: z.string().datetime().optional().or(z.string().length(0)).transform((v) => (v ? v : undefined)),
  gender: z.nativeEnum(Gender).optional(),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  bloodGroup: z.string().max(5).optional(),
  guardianName: z.string().optional(),
  address: z.string().optional(),
});

const updatePatientSchema = createPatientSchema.partial();

const listPatientsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

router.use(requireAuth);

router.get("/", validateQuery(listPatientsQuerySchema), patientController.list);
router.post("/", parseFormData, validateBody(createPatientSchema), patientController.create);
router.get("/:id", patientController.getOne);
router.patch("/:id", parseFormData, validateBody(updatePatientSchema), patientController.update);

router.use("/:patientId/visits", visitRoutes);

export default router;
