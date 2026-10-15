import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { requireSuperAdmin } from "../../middleware/superAdmin";
import { validateBody, validateQuery } from "../../middleware/validate";
import { parseFormData } from "../../middleware/formData";
import * as superAdminController from "./superAdmin.controller";

const router = Router();

router.use(requireAuth, requireSuperAdmin);

const listClientsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.enum(["AYURVEDIC", "DENTAL"]).optional(),
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"]).optional(),
});

const createClientSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["AYURVEDIC", "DENTAL"]),
  phone: z.string().min(6),
  address: z.string().optional(),
  plan: z.enum(["TRIAL", "STANDARD", "PREMIUM"]),
  ownerName: z.string().min(1),
  ownerPhone: z.string().min(6),
  ownerEmail: z.string().email().optional(),
});

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(["AYURVEDIC", "DENTAL"]).optional(),
  phone: z.string().min(6).optional(),
  address: z.string().optional(),
});

const updateSubscriptionSchema = z.object({
  plan: z.enum(["TRIAL", "STANDARD", "PREMIUM"]).optional(),
  status: z.enum(["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"]).optional(),
  renewsAt: z.string().datetime().optional(),
});

router.get("/clients", validateQuery(listClientsQuerySchema), superAdminController.listClients);
router.post(
  "/clients",
  parseFormData,
  validateBody(createClientSchema),
  superAdminController.createClient,
);
router.get("/clients/:id", superAdminController.getClient);
router.patch(
  "/clients/:id",
  parseFormData,
  validateBody(updateClientSchema),
  superAdminController.updateClient,
);
router.patch(
  "/clients/:id/subscription",
  parseFormData,
  validateBody(updateSubscriptionSchema),
  superAdminController.updateSubscription,
);
router.post("/clients/:id/suspend", superAdminController.suspendClient);
router.post("/clients/:id/activate", superAdminController.activateClient);
router.delete("/clients/:id", superAdminController.deleteClient);

// Legacy alias kept for the existing Vendor console frontend
router.get("/clinics", superAdminController.listClients);

export default router;
