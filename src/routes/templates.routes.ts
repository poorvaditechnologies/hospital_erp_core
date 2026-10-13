import { Router } from "express";
import { z } from "zod";
import { TemplateCategory } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as templateController from "../controllers/template.controller";

const router = Router();

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.nativeEnum(TemplateCategory),
  bodyText: z.string().min(1, "Message body is required"),
  variables: z.array(z.string()).optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.nativeEnum(TemplateCategory).optional(),
  bodyText: z.string().min(1).optional(),
});

const sendTemplateSchema = z.object({
  patientIds: z.array(z.string()).min(1, "Select at least one patient"),
});

router.use(requireAuth);

router.get("/", templateController.list);
router.post("/", requireRole("ADMIN"), validateBody(createTemplateSchema), templateController.create);
router.patch(
  "/:id",
  requireRole("ADMIN"),
  validateBody(updateTemplateSchema),
  templateController.update,
);
router.delete("/:id", requireRole("ADMIN"), templateController.remove);
router.post("/:id/send", validateBody(sendTemplateSchema), templateController.send);
router.get("/logs/recent", templateController.listLogs);

export default router;
