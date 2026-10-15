import { prisma } from "../../lib/prisma";

export interface UpdateClinicInput {
  name?: string;
  phone?: string;
  address?: string;
}

export async function getClinic(clinicId: string) {
  return prisma.clinic.findUniqueOrThrow({
    where: { id: clinicId },
    include: { subscription: true },
  });
}

export async function updateClinic(clinicId: string, input: UpdateClinicInput) {
  return prisma.clinic.update({ where: { id: clinicId }, data: input });
}
