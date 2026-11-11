import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const p = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash("password123", 10);
  await p.user.upsert({
    where: { email: "admin@aiatlas.dev" },
    update: { role: "ADMIN", passwordHash: hash },
    create: { email: "admin@aiatlas.dev", name: "Admin", passwordHash: hash, role: "ADMIN" },
  });
  console.log("admin created");
}
main().finally(() => p.$disconnect());
