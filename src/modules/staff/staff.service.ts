import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../../types/errors";

const staffSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export interface CreateStaffInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: UserRole;
}

export interface UpdateStaffInput {
  name?: string;
  phone?: string;
  email?: string;
}

export async function listStaff(clinicId: string) {
  return prisma.user.findMany({
    where: { clinicId },
    orderBy: { createdAt: "asc" },
    select: staffSelect,
  });
}

export async function createStaff(clinicId: string, input: CreateStaffInput) {
  const existing = await prisma.user.findUnique({
    where: { clinicId_phone: { clinicId, phone: input.phone } },
  });
  if (existing) {
    throw new ConflictError(`A staff account with phone ${input.phone} already exists`);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  return prisma.user.create({
    data: {
      clinicId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      passwordHash,
      role: input.role,
    },
    select: staffSelect,
  });
}

async function findActiveClinicUser(clinicId: string, id: string) {
  const user = await prisma.user.findFirst({ where: { id, clinicId } });
  if (!user) throw new NotFoundError("Staff member not found");
  return user;
}

export async function updateStaff(clinicId: string, id: string, input: UpdateStaffInput) {
  await findActiveClinicUser(clinicId, id);

  if (input.phone) {
    const existing = await prisma.user.findUnique({
      where: { clinicId_phone: { clinicId, phone: input.phone } },
    });
    if (existing && existing.id !== id) {
      throw new ConflictError(`A staff account with phone ${input.phone} already exists`);
    }
  }

  return prisma.user.update({
    where: { id },
    data: { name: input.name, phone: input.phone, email: input.email },
    select: staffSelect,
  });
}

export async function updateStaffRole(clinicId: string, id: string, role: UserRole) {
  await findActiveClinicUser(clinicId, id);

  return prisma.user.update({
    where: { id },
    data: { role },
    select: staffSelect,
  });
}

export async function setStaffActive(
  clinicId: string,
  id: string,
  requestingUserId: string,
  isActive: boolean,
) {
  if (id === requestingUserId) {
    throw new ValidationError("You can't deactivate your own account");
  }
  await findActiveClinicUser(clinicId, id);

  return prisma.user.update({
    where: { id },
    data: { isActive },
    select: staffSelect,
  });
}
