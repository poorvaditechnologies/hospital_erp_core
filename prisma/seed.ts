import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const clinic = await prisma.clinic.upsert({
    where: { id: "seed-clinic" },
    update: { name: "Jataveda Ayurvedic Clinic" },
    create: {
      id: "seed-clinic",
      name: "Jataveda Ayurvedic Clinic",
      phone: "9900000000",
      address: "Jayanagar, Bengaluru",
    },
  });

  await prisma.subscription.upsert({
    where: { clinicId: clinic.id },
    update: {},
    create: { clinicId: clinic.id, plan: "STANDARD", status: "ACTIVE" },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { clinicId_phone: { clinicId: clinic.id, phone: "9999999999" } },
    update: {},
    create: {
      clinicId: clinic.id,
      name: "Clinic Admin",
      phone: "9999999999",
      email: "admin@clinic.test",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { clinicId_phone: { clinicId: clinic.id, phone: "9876500001" } },
    update: {},
    create: {
      clinicId: clinic.id,
      name: "Priya Nair",
      phone: "9876500001",
      passwordHash: await bcrypt.hash("frontdesk123", 10),
      role: "FRONT_DESK",
    },
  });

  const demoPatients = [
    { name: "Rahul Sharma", phone: "9812345678", guardianName: "Sunita Sharma" },
    { name: "Ananya Iyer", phone: "9812345001", guardianName: "Lakshmi Iyer" },
    { name: "Kabir Mehta", phone: "9812345002", guardianName: "Rina Mehta" },
    { name: "Sara Fernandes", phone: "9812345003", guardianName: null },
    { name: "Arjun Rao", phone: "9812345004", guardianName: "Deepa Rao" },
    { name: "Meera Pillai", phone: "9812345005", guardianName: null },
  ];

  const patients = [];
  for (const p of demoPatients) {
    const patient = await prisma.patient.upsert({
      where: { clinicId_phone: { clinicId: clinic.id, phone: p.phone } },
      update: {},
      create: { clinicId: clinic.id, name: p.name, phone: p.phone, guardianName: p.guardianName },
    });
    patients.push(patient);
  }

  const existingVisits = await prisma.visit.count({ where: { clinicId: clinic.id } });
  if (existingVisits < 5) {
    const visitTypes = ["SWARNA_PRASHANA", "WALKIN", "CHECKUP"] as const;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = 0; i < 16; i++) {
      const patient = patients[i % patients.length];
      const daysAgo = Math.floor(Math.random() * 13);
      const visitType = visitTypes[i % visitTypes.length];
      const hasFollowUp = i % 3 === 0;

      await prisma.visit.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          visitType,
          visitDate: new Date(now - daysAgo * dayMs),
          complaint: visitType === "SWARNA_PRASHANA" ? "Monthly immunity dose" : "General checkup",
          nextFollowUpDate: hasFollowUp ? new Date(now + ((i % 5) + 1) * dayMs) : undefined,
        },
      });
    }
  }

  const existingOrders = await prisma.kitOrder.count({ where: { clinicId: clinic.id } });
  if (existingOrders < 5) {
    const orderPlan: { status: "PLACED" | "SHIPPED" | "DELIVERED" | "CANCELLED"; paid: boolean; daysAgo: number }[] = [
      { status: "DELIVERED", paid: true, daysAgo: 45 },
      { status: "DELIVERED", paid: true, daysAgo: 40 },
      { status: "DELIVERED", paid: true, daysAgo: 20 },
      { status: "DELIVERED", paid: true, daysAgo: 15 },
      { status: "SHIPPED", paid: true, daysAgo: 5 },
      { status: "PLACED", paid: false, daysAgo: 2 },
      { status: "PLACED", paid: false, daysAgo: 1 },
      { status: "CANCELLED", paid: false, daysAgo: 10 },
    ];

    const dayMs = 24 * 60 * 60 * 1000;
    for (let i = 0; i < orderPlan.length; i++) {
      const plan = orderPlan[i];
      const patient = patients[i % patients.length];
      await prisma.kitOrder.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          items: "Swarna Prashana kit",
          quantity: 1,
          amount: 499,
          status: plan.status,
          paymentStatus: plan.paid ? "PAID" : "PENDING",
          shippingAddress: "Bengaluru",
          orderDate: new Date(Date.now() - plan.daysAgo * dayMs),
          shippedDate: plan.status !== "PLACED" ? new Date(Date.now() - plan.daysAgo * dayMs) : undefined,
        },
      });
    }
  }

  console.log("Seeded clinic, admin user, demo patients, visits, and kit orders");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
