import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireSuperAdmin } from "../middleware/superAdmin";
import * as superAdminController from "../controllers/superAdmin.controller";

const router = Router();

router.use(requireAuth, requireSuperAdmin);

router.get("/clinics", superAdminController.listClinics);

export default router;
