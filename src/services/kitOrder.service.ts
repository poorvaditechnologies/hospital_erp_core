import { KitOrderPaymentStatus, KitOrderStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { NotFoundError, ValidationError } from "../types/errors";

export interface CreateKitOrderInput {
  patientId?: string;
  items: string;
  quantity: number;
  amount: number;
  shippingAddress: string;
}

export interface UpdateKitOrderInput {
  items?: string;
  quantity?: number;
  amount?: number;
  shippingAddress?: string;
  status?: KitOrderStatus;
  paymentStatus?: KitOrderPaymentStatus;
}

export async function listKitOrders(clinicId: string) {
  return prisma.kitOrder.findMany({
    where: { clinicId },
    orderBy: { orderDate: "desc" },
    include: { patient: { select: { name: true, phone: true } } },
  });
}

export async function createKitOrder(clinicId: string, input: CreateKitOrderInput) {
  return prisma.kitOrder.create({
    data: {
      clinicId,
      patientId: input.patientId,
      items: input.items,
      quantity: input.quantity,
      amount: input.amount,
      shippingAddress: input.shippingAddress,
    },
  });
}

export async function updateKitOrder(clinicId: string, id: string, input: UpdateKitOrderInput) {
  const order = await prisma.kitOrder.findFirst({ where: { id, clinicId } });
  if (!order) throw new NotFoundError("Kit order not found");

  const editingDetails =
    input.items !== undefined ||
    input.quantity !== undefined ||
    input.amount !== undefined ||
    input.shippingAddress !== undefined;

  if (editingDetails && order.status !== "PLACED") {
    throw new ValidationError("Only orders that haven't shipped yet can be edited");
  }

  return prisma.kitOrder.update({
    where: { id },
    data: {
      items: input.items,
      quantity: input.quantity,
      amount: input.amount,
      shippingAddress: input.shippingAddress,
      status: input.status,
      paymentStatus: input.paymentStatus,
      shippedDate: input.status === "SHIPPED" ? new Date() : undefined,
    },
  });
}
