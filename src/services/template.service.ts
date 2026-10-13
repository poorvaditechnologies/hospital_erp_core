import { TemplateCategory } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../types/errors";
import { getWhatsAppProvider } from "../integrations/whatsapp";

export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  bodyText: string;
  variables?: string[];
}

export interface UpdateTemplateInput {
  name?: string;
  category?: TemplateCategory;
  bodyText?: string;
}

export async function listTemplates(clinicId: string) {
  return prisma.whatsAppTemplate.findMany({
    where: { clinicId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTemplate(clinicId: string, input: CreateTemplateInput) {
  const provider = getWhatsAppProvider();
  const { providerTemplateId } = await provider.createTemplate({
    name: input.name,
    category: input.category,
    bodyText: input.bodyText,
  });

  return prisma.whatsAppTemplate.create({
    data: {
      clinicId,
      name: input.name,
      category: input.category,
      bodyText: input.bodyText,
      variables: input.variables ? JSON.stringify(input.variables) : undefined,
      approvalStatus: "PENDING",
      metaTemplateId: providerTemplateId,
    },
  });
}

export async function updateTemplate(clinicId: string, id: string, input: UpdateTemplateInput) {
  const template = await prisma.whatsAppTemplate.findFirst({ where: { id, clinicId } });
  if (!template) throw new NotFoundError("Template not found");
  if (template.approvalStatus === "APPROVED") {
    throw new ValidationError(
      "This template is already approved by the BSP — create a new template instead of editing an approved one",
    );
  }

  return prisma.whatsAppTemplate.update({
    where: { id },
    data: { name: input.name, category: input.category, bodyText: input.bodyText },
  });
}

export async function deleteTemplate(clinicId: string, id: string) {
  const template = await prisma.whatsAppTemplate.findFirst({ where: { id, clinicId } });
  if (!template) throw new NotFoundError("Template not found");

  const logCount = await prisma.whatsAppMessageLog.count({ where: { templateId: id } });
  if (logCount > 0) {
    throw new ConflictError(
      "This template has already been sent to patients — it can't be deleted, only new templates can be removed",
    );
  }

  await prisma.whatsAppTemplate.delete({ where: { id } });
}

export async function sendTemplateToPatients(
  clinicId: string,
  templateId: string,
  patientIds: string[],
  triggeredBy: string,
) {
  const template = await prisma.whatsAppTemplate.findFirst({ where: { id: templateId, clinicId } });
  if (!template) throw new NotFoundError("Template not found");
  if (template.approvalStatus !== "APPROVED" && template.approvalStatus !== "PENDING") {
    throw new ValidationError("This template is not approved for sending yet");
  }

  const patients = await prisma.patient.findMany({
    where: { id: { in: patientIds }, clinicId },
  });
  if (patients.length === 0) throw new NotFoundError("No matching patients found");

  const provider = getWhatsAppProvider();
  const results = [];

  for (const patient of patients) {
    const result = await provider.sendTemplateMessage({
      toPhone: patient.phone,
      templateName: template.name,
      bodyText: template.bodyText,
    });

    const log = await prisma.whatsAppMessageLog.create({
      data: {
        clinicId,
        patientId: patient.id,
        templateId: template.id,
        triggeredBy,
        status: result.success ? "SENT" : "FAILED",
      },
    });
    results.push(log);
  }

  return results;
}

export async function listMessageLogs(clinicId: string) {
  return prisma.whatsAppMessageLog.findMany({
    where: { clinicId },
    orderBy: { sentAt: "desc" },
    take: 100,
    include: {
      patient: { select: { name: true, phone: true } },
      template: { select: { name: true } },
    },
  });
}
