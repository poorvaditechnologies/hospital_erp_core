import { VisitType, NotesVisibility } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { NotFoundError } from "../../types/errors";

export interface CreateVisitInput {
  visitType: VisitType;
  visitDate?: string;
  complaint?: string;
  diagnosis?: string;
  prescriptionNotes?: string;
  nextFollowUpDate?: string;
  notesVisibility?: NotesVisibility;
  doctorId?: string;
}

export interface UpdateVisitInput {
  complaint?: string;
  diagnosis?: string;
  prescriptionNotes?: string;
  nextFollowUpDate?: string;
  notesVisibility?: NotesVisibility;
}

async function ensurePatientInClinic(clinicId: string, patientId: string) {
  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } });
  if (!patient) throw new NotFoundError("Patient not found");
}

export async function listVisitsForPatient(clinicId: string, patientId: string) {
  await ensurePatientInClinic(clinicId, patientId);
  return prisma.visit.findMany({
    where: { clinicId, patientId },
    orderBy: { visitDate: "desc" },
  });
}

export async function createVisit(clinicId: string, patientId: string, input: CreateVisitInput) {
  await ensurePatientInClinic(clinicId, patientId);

  return prisma.visit.create({
    data: {
      clinicId,
      patientId,
      visitType: input.visitType,
      visitDate: input.visitDate ? new Date(input.visitDate) : undefined,
      complaint: input.complaint,
      diagnosis: input.diagnosis,
      prescriptionNotes: input.prescriptionNotes,
      nextFollowUpDate: input.nextFollowUpDate ? new Date(input.nextFollowUpDate) : undefined,
      notesVisibility: input.notesVisibility,
      doctorId: input.doctorId,
    },
  });
}

export async function updateVisit(clinicId: string, id: string, input: UpdateVisitInput) {
  const visit = await prisma.visit.findFirst({ where: { id, clinicId } });
  if (!visit) throw new NotFoundError("Visit not found");

  return prisma.visit.update({
    where: { id },
    data: {
      complaint: input.complaint,
      diagnosis: input.diagnosis,
      prescriptionNotes: input.prescriptionNotes,
      nextFollowUpDate: input.nextFollowUpDate ? new Date(input.nextFollowUpDate) : undefined,
      notesVisibility: input.notesVisibility,
    },
  });
}
