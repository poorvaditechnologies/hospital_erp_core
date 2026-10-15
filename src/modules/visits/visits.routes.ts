import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { parseFormData } from "../../middleware/formData";
import * as visitController from "./visit.controller";
import { updateVisitSchema } from "./visit.schemas";

const router = Router();

router.use(requireAuth);

router.patch("/:id", parseFormData, validateBody(updateVisitSchema), visitController.update);

export default router;
