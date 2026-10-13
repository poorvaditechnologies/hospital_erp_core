import { Router } from "express";
import { z } from "zod";
import { KitOrderPaymentStatus, KitOrderStatus } from "@prisma/client";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import * as kitOrderController from "../controllers/kitOrder.controller";

const router = Router();

const createKitOrderSchema = z.object({
  patientId: z.string().optional(),
  items: z.string().min(1, "List the items in this order"),
  quantity: z.number().int().min(1).default(1),
  amount: z.number().int().min(0, "Amount must be zero or more"),
  shippingAddress: z.string().min(1, "Shipping address is required"),
});

const updateKitOrderSchema = z.object({
  items: z.string().min(1).optional(),
  quantity: z.number().int().min(1).optional(),
  amount: z.number().int().min(0).optional(),
  shippingAddress: z.string().min(1).optional(),
  status: z.nativeEnum(KitOrderStatus).optional(),
  paymentStatus: z.nativeEnum(KitOrderPaymentStatus).optional(),
});

router.use(requireAuth);

router.get("/", kitOrderController.list);
router.post("/", validateBody(createKitOrderSchema), kitOrderController.create);
router.patch("/:id", validateBody(updateKitOrderSchema), kitOrderController.update);

export default router;
