import { Router } from "express";
import { z } from "zod";
import { TemplateCategory } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { parseFormData } from "../../middleware/formData";
import { formArray } from "../../lib/zodFormData";
import * as templateController from "./template.controller";

const router = Router();

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.nativeEnum(TemplateCategory),
  bodyText: z.string().min(1, "Message body is required"),
  variables: formArray(z.string()).optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.nativeEnum(TemplateCategory).optional(),
  bodyText: z.string().min(1).optional(),
});

const sendTemplateSchema = z.object({
  patientIds: formArray(z.string()).refine((v) => v.length > 0, "Select at least one patient"),
});

router.use(requireAuth);

router.get("/", templateController.list);
router.post(
  "/",
  requireRole("ADMIN"),
  parseFormData,
  validateBody(createTemplateSchema),
  templateController.create,
);
router.patch(
  "/:id",
  requireRole("ADMIN"),
  parseFormData,
  validateBody(updateTemplateSchema),
  templateController.update,
);
router.delete("/:id", requireRole("ADMIN"), templateController.remove);
router.post("/:id/send", parseFormData, validateBody(sendTemplateSchema), templateController.send);
router.get("/logs/recent", templateController.listLogs);

export default router;
