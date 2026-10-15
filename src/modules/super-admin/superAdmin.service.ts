import bcrypt from "bcrypt";
import crypto from "crypto";
import { ClinicCategory, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../types/errors";
import { PLATFORM_CLINIC_ID } from "../../lib/constants";

export interface ListClientsFilter {
  search?: string;
  category?: ClinicCategory;
  status?: SubscriptionStatus;
}

export async function listClients(filter: ListClientsFilter) {
  const clinics = await prisma.clinic.findMany({
    where: {
      id: { not: PLATFORM_CLINIC_ID },
      ...(filter.search
        ? { name: { contains: filter.search, mode: "insensitive" as const } }
        : {}),
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.status ? { subscription: { status: filter.status } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      subscription: true,
      _count: { select: { users: true, patients: true, visits: true } },
    },
  });

  return clinics.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    phone: c.phone,
    address: c.address,
    isActive: c.isActive,
    plan: c.subscription?.plan ?? null,
    status: c.subscription?.status ?? null,
    renewsAt: c.subscription?.renewsAt ?? null,
    createdAt: c.createdAt,
    staffCount: c._count.users,
    patientCount: c._count.patients,
    visitCount: c._count.visits,
  }));
}

export async function getClient(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: {
      subscription: true,
      users: {
        where: { role: "ADMIN" },
        select: { id: true, name: true, phone: true, email: true, isActive: true, createdAt: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      _count: { select: { users: true, patients: true, visits: true } },
    },
  });

  if (!clinic) throw new NotFoundError("Client not found");

  return {
    id: clinic.id,
    name: clinic.name,
    category: clinic.category,
    phone: clinic.phone,
    address: clinic.address,
    isActive: clinic.isActive,
    createdAt: clinic.createdAt,
    subscription: clinic.subscription,
    owner: clinic.users[0] ?? null,
    staffCount: clinic._count.users,
    patientCount: clinic._count.patients,
    visitCount: clinic._count.visits,
  };
}

export interface CreateClientInput {
  name: string;
  category: ClinicCategory;
  phone: string;
  address?: string;
  plan: SubscriptionPlan;
  ownerName: string;
  ownerPhone: string;
  ownerEmail?: string;
}

function generateTempPassword() {
  return crypto.randomBytes(6).toString("base64url");
}

export async function createClient(input: CreateClientInput) {
  const existingOwnerPhoneClash = await prisma.user.findFirst({
    where: { phone: input.ownerPhone },
  });
  if (existingOwnerPhoneClash) {
    throw new ConflictError("A staff account with this owner phone number already exists");
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.create({
      data: {
        name: input.name,
        category: input.category,
        phone: input.phone,
        address: input.address,
      },
    });

    const subscription = await tx.subscription.create({
      data: {
        clinicId: clinic.id,
        plan: input.plan,
        status: input.plan === "TRIAL" ? "TRIAL" : "ACTIVE",
      },
    });

    const owner = await tx.user.create({
      data: {
        clinicId: clinic.id,
        name: input.ownerName,
        phone: input.ownerPhone,
        email: input.ownerEmail,
        passwordHash,
        role: "ADMIN",
      },
    });

    return { clinic, subscription, owner };
  });

  return {
    clinic: result.clinic,
    subscription: result.subscription,
    owner: {
      id: result.owner.id,
      name: result.owner.name,
      phone: result.owner.phone,
      email: result.owner.email,
    },
    temporaryPassword: tempPassword,
  };
}

export interface UpdateClientInput {
  name?: string;
  category?: ClinicCategory;
  phone?: string;
  address?: string;
}

export async function updateClient(clinicId: string, input: UpdateClientInput) {
  await prisma.clinic.findUniqueOrThrow({ where: { id: clinicId } }).catch(() => {
    throw new NotFoundError("Client not found");
  });

  return prisma.clinic.update({ where: { id: clinicId }, data: input });
}

export interface UpdateSubscriptionInput {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  renewsAt?: Date | null;
}

export async function updateSubscription(clinicId: string, input: UpdateSubscriptionInput) {
  const existing = await prisma.subscription.findUnique({ where: { clinicId } });
  if (!existing) throw new NotFoundError("Subscription not found for this client");

  return prisma.subscription.update({
    where: { clinicId },
    data: {
      ...input,
      cancelledAt: input.status === "CANCELLED" ? new Date() : existing.cancelledAt,
    },
  });
}

export async function setClientActive(clinicId: string, isActive: boolean) {
  await prisma.clinic.findUniqueOrThrow({ where: { id: clinicId } }).catch(() => {
    throw new NotFoundError("Client not found");
  });

  const [clinic] = await prisma.$transaction([
    prisma.clinic.update({ where: { id: clinicId }, data: { isActive } }),
    prisma.subscription.updateMany({
      where: { clinicId },
      data: { status: isActive ? "ACTIVE" : "SUSPENDED" },
    }),
  ]);

  return clinic;
}

export async function deleteClient(clinicId: string) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    include: { _count: { select: { patients: true, visits: true, kitOrders: true } } },
  });

  if (!clinic) throw new NotFoundError("Client not found");

  const hasData =
    clinic._count.patients > 0 || clinic._count.visits > 0 || clinic._count.kitOrders > 0;

  if (hasData) {
    throw new ConflictError(
      "This client has patient/visit/order data and cannot be deleted — suspend it instead",
    );
  }

  await prisma.$transaction([
    prisma.user.deleteMany({ where: { clinicId } }),
    prisma.subscription.deleteMany({ where: { clinicId } }),
    prisma.clinic.delete({ where: { id: clinicId } }),
  ]);
}
