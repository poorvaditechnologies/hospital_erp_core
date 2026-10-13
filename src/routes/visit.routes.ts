import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as visitController from "../controllers/visit.controller";
import { updateVisitSchema } from "./visits.routes";

const router = Router();

router.use(requireAuth);

router.patch("/:id", validateBody(updateVisitSchema), visitController.update);

export default router;
