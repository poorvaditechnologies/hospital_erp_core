import { prisma } from "../lib/prisma";

export async function listClinics() {
  const clinics = await prisma.clinic.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      createdAt: true,
      _count: { select: { users: true, patients: true, visits: true } },
    },
  });

  return clinics.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    subscriptionPlan: c.subscriptionPlan,
    subscriptionStatus: c.subscriptionStatus,
    createdAt: c.createdAt,
    staffCount: c._count.users,
    patientCount: c._count.patients,
    visitCount: c._count.visits,
  }));
}
