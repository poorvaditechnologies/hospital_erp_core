import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import * as reportController from "../controllers/report.controller";

const router = Router();

router.use(requireAuth);

router.get("/summary", reportController.summary);
router.get("/dashboard", reportController.dashboard);
router.get("/insights", requireRole("ADMIN"), reportController.insights);
router.get("/export/patients.csv", requireRole("ADMIN"), reportController.exportPatientsCsv);
router.get("/export/visits.csv", requireRole("ADMIN"), reportController.exportVisitsCsv);
router.get("/export/kit-orders.csv", requireRole("ADMIN"), reportController.exportKitOrdersCsv);

export default router;
