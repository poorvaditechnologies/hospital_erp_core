import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { parseFormData } from "../../middleware/formData";
import * as visitController from "../visits/visit.controller";
import { createVisitSchema } from "../visits/visit.schemas";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/", visitController.list);
router.post("/", parseFormData, validateBody(createVisitSchema), visitController.create);

export default router;
