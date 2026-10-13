import { prisma } from "../lib/prisma";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getSummary(clinicId: string, includeRevenue: boolean) {
  const today = startOfToday();
  const monthStart = startOfMonth();
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [totalPatients, visitsToday, followUpsDue, swarnaPrashanaDueThisWeek, pendingKitOrders] =
    await Promise.all([
      prisma.patient.count({ where: { clinicId } }),
      prisma.visit.count({ where: { clinicId, visitDate: { gte: today } } }),
      prisma.visit.count({ where: { clinicId, nextFollowUpDate: { gte: today, lte: now } } }),
      prisma.visit.count({
        where: {
          clinicId,
          visitType: "SWARNA_PRASHANA",
          nextFollowUpDate: { gte: today, lte: in7Days },
        },
      }),
      prisma.kitOrder.count({ where: { clinicId, status: { in: ["PLACED"] } } }),
    ]);

  let kitRevenueThisMonth: number | undefined;
  if (includeRevenue) {
    const revenue = await prisma.kitOrder.aggregate({
      where: { clinicId, orderDate: { gte: monthStart }, paymentStatus: "PAID" },
      _sum: { amount: true },
    });
    kitRevenueThisMonth = revenue._sum.amount ?? 0;
  }

  return {
    totalPatients,
    visitsToday,
    followUpsDue,
    swarnaPrashanaDueThisWeek,
    pendingKitOrders,
    kitRevenueThisMonth,
  };
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function getVisitsTrend(clinicId: string, days = 14) {
  const today = startOfToday();
  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - (days - 1));

  const visits = await prisma.visit.findMany({
    where: { clinicId, visitDate: { gte: rangeStart } },
    select: { visitDate: true },
  });

  const counts = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + i);
    counts.set(d.toISOString().slice(0, 10), 0);
  }
  for (const visit of visits) {
    const key = startOfDay(visit.visitDate).toISOString().slice(0, 10);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

export async function getVisitTypeBreakdown(clinicId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const grouped = await prisma.visit.groupBy({
    by: ["visitType"],
    where: { clinicId, visitDate: { gte: thirtyDaysAgo } },
    _count: { _all: true },
  });

  return grouped.map((g) => ({ visitType: g.visitType, count: g._count._all }));
}

export async function getKitOrderStatusBreakdown(clinicId: string) {
  const grouped = await prisma.kitOrder.groupBy({
    by: ["status"],
    where: { clinicId },
    _count: { _all: true },
  });

  return grouped.map((g) => ({ status: g.status, count: g._count._all }));
}

export async function getRevenueTrend(clinicId: string, months = 6) {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const orders = await prisma.kitOrder.findMany({
    where: { clinicId, orderDate: { gte: rangeStart }, paymentStatus: "PAID" },
    select: { orderDate: true, amount: true },
  });

  const sums = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    sums.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const order of orders) {
    const key = `${order.orderDate.getFullYear()}-${String(order.orderDate.getMonth() + 1).padStart(2, "0")}`;
    if (sums.has(key)) sums.set(key, (sums.get(key) ?? 0) + order.amount);
  }

  return Array.from(sums.entries()).map(([month, amount]) => ({ month, amount }));
}

export async function getUpcomingFollowUps(clinicId: string, limit = 5) {
  const today = startOfToday();
  return prisma.visit.findMany({
    where: { clinicId, nextFollowUpDate: { gte: today } },
    orderBy: { nextFollowUpDate: "asc" },
    take: limit,
    include: { patient: { select: { id: true, name: true, phone: true } } },
  });
}

export async function getRecentVisits(clinicId: string, limit = 6) {
  return prisma.visit.findMany({
    where: { clinicId },
    orderBy: { visitDate: "desc" },
    take: limit,
    include: { patient: { select: { id: true, name: true } } },
  });
}

export async function getDashboardData(clinicId: string, includeRevenue: boolean) {
  const [visitsTrend, visitTypeBreakdown, kitOrderStatusBreakdown, upcomingFollowUps, recentVisits] =
    await Promise.all([
      getVisitsTrend(clinicId),
      getVisitTypeBreakdown(clinicId),
      getKitOrderStatusBreakdown(clinicId),
      getUpcomingFollowUps(clinicId),
      getRecentVisits(clinicId),
    ]);

  const revenueTrend = includeRevenue ? await getRevenueTrend(clinicId) : undefined;

  return { visitsTrend, visitTypeBreakdown, kitOrderStatusBreakdown, revenueTrend, upcomingFollowUps, recentVisits };
}

export async function getPatientGrowth(clinicId: string, months = 6) {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const patients = await prisma.patient.findMany({
    where: { clinicId, createdAt: { gte: rangeStart } },
    select: { createdAt: true },
  });

  const counts = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
    counts.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const patient of patients) {
    const key = `${patient.createdAt.getFullYear()}-${String(patient.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([month, count]) => ({ month, count }));
}

export async function getMessagePerformance(clinicId: string, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const grouped = await prisma.whatsAppMessageLog.groupBy({
    by: ["status"],
    where: { clinicId, sentAt: { gte: cutoff } },
    _count: { _all: true },
  });

  return grouped.map((g) => ({ status: g.status, count: g._count._all }));
}

export async function getReportInsights(clinicId: string) {
  const [patientGrowth, messagePerformance] = await Promise.all([
    getPatientGrowth(clinicId),
    getMessagePerformance(clinicId),
  ]);

  return { patientGrowth, messagePerformance };
}

export async function getVisitsCsv(clinicId: string) {
  const visits = await prisma.visit.findMany({
    where: { clinicId },
    orderBy: { visitDate: "asc" },
    include: { patient: { select: { name: true, phone: true } } },
  });

  const header = "Patient,Phone,Visit type,Visit date,Complaint,Diagnosis,Next follow-up";
  const rows = visits.map((v) =>
    [
      v.patient.name,
      v.patient.phone,
      v.visitType,
      v.visitDate.toISOString().slice(0, 10),
      v.complaint ?? "",
      v.diagnosis ?? "",
      v.nextFollowUpDate ? v.nextFollowUpDate.toISOString().slice(0, 10) : "",
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [header, ...rows].join("\n");
}

export async function getKitOrdersCsv(clinicId: string) {
  const orders = await prisma.kitOrder.findMany({
    where: { clinicId },
    orderBy: { orderDate: "asc" },
    include: { patient: { select: { name: true, phone: true } } },
  });

  const header = "Customer,Phone,Items,Quantity,Amount,Payment status,Status,Order date,Shipping address";
  const rows = orders.map((o) =>
    [
      o.patient?.name ?? "Guest",
      o.patient?.phone ?? "",
      o.items,
      o.quantity,
      o.amount,
      o.paymentStatus,
      o.status,
      o.orderDate.toISOString().slice(0, 10),
      o.shippingAddress,
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [header, ...rows].join("\n");
}

export async function getPatientsCsv(clinicId: string) {
  const patients = await prisma.patient.findMany({
    where: { clinicId },
    orderBy: { createdAt: "asc" },
  });

  const header = "Name,Phone,Guardian,Address,DOB,Registered on";
  const rows = patients.map((p) =>
    [
      p.name,
      p.phone,
      p.guardianName ?? "",
      p.address ?? "",
      p.dob ? p.dob.toISOString().slice(0, 10) : "",
      p.createdAt.toISOString().slice(0, 10),
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [header, ...rows].join("\n");
}
