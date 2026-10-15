import { Gender } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../types/errors";

export interface CreatePatientInput {
  name: string;
  phone: string;
  dob?: string;
  gender?: Gender;
  email?: string;
  bloodGroup?: string;
  guardianName?: string;
  address?: string;
}

export interface UpdatePatientInput {
  name?: string;
  phone?: string;
  dob?: string;
  gender?: Gender;
  email?: string;
  bloodGroup?: string;
  guardianName?: string;
  address?: string;
}

export async function listPatients(
  clinicId: string,
  search: string | undefined,
  page: number,
  pageSize: number,
) {
  const where = {
    clinicId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.patient.count({ where }),
  ]);

  return { patients, total };
}

export async function getPatient(clinicId: string, id: string) {
  const patient = await prisma.patient.findFirst({ where: { id, clinicId } });
  if (!patient) throw new NotFoundError("Patient not found");
  return patient;
}

export async function createPatient(clinicId: string, input: CreatePatientInput) {
  const existing = await prisma.patient.findUnique({
    where: { clinicId_phone: { clinicId, phone: input.phone } },
  });
  if (existing) {
    throw new ConflictError(
      `This phone number is already registered to ${existing.name} — open their record instead`,
    );
  }

  return prisma.patient.create({
    data: {
      clinicId,
      name: input.name,
      phone: input.phone,
      dob: input.dob ? new Date(input.dob) : undefined,
      gender: input.gender,
      email: input.email,
      bloodGroup: input.bloodGroup,
      guardianName: input.guardianName,
      address: input.address,
    },
  });
}

export async function updatePatient(clinicId: string, id: string, input: UpdatePatientInput) {
  await getPatient(clinicId, id);

  if (input.phone) {
    const existing = await prisma.patient.findUnique({
      where: { clinicId_phone: { clinicId, phone: input.phone } },
    });
    if (existing && existing.id !== id) {
      throw new ConflictError(
        `This phone number is already registered to ${existing.name} — open their record instead`,
      );
    }
  }

  return prisma.patient.update({
    where: { id },
    data: {
      name: input.name,
      phone: input.phone,
      dob: input.dob ? new Date(input.dob) : undefined,
      gender: input.gender,
      email: input.email,
      bloodGroup: input.bloodGroup,
      guardianName: input.guardianName,
      address: input.address,
    },
  });
}
