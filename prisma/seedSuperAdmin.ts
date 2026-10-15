import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const PLATFORM_CLINIC_ID = "platform-hq";

// Creates only the platform super admin account. Client clinics are created
// afterwards by this super admin via the platform console APIs — no demo
// clients are seeded here.
async function main() {
  const name = process.env.SUPER_ADMIN_NAME ?? "Platform Admin";
  const phone = process.env.SUPER_ADMIN_PHONE ?? "9000000000";
  const email = process.env.SUPER_ADMIN_EMAIL ?? "superadmin@platform.test";
  const password = process.env.SUPER_ADMIN_PASSWORD ?? "changeme123";

  if (password === "changeme123") {
    console.warn(
      "Using the default super admin password — set SUPER_ADMIN_PASSWORD before running this in a shared environment.",
    );
  }

  const platformClinic = await prisma.clinic.upsert({
    where: { id: PLATFORM_CLINIC_ID },
    update: {},
    create: {
      id: PLATFORM_CLINIC_ID,
      name: "Platform Operations",
      phone: "0000000000",
      category: "AYURVEDIC",
    },
  });

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { clinicId_phone: { clinicId: platformClinic.id, phone } },
    update: { isSuperAdmin: true, name, email },
    create: {
      clinicId: platformClinic.id,
      name,
      phone,
      email,
      passwordHash,
      role: "ADMIN",
      isSuperAdmin: true,
    },
  });

  console.log(`Super admin ready — phone: ${phone}${password === "changeme123" ? ", password: changeme123 (default, please change)" : ""}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
