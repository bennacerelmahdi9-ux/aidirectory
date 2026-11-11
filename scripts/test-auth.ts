import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const p = new PrismaClient();
async function main() {
  const user = await p.user.findUnique({ where: { email: "admin@aiatlas.dev" } });
  console.log("user:", user?.id, user?.email, user?.role);
  if (user?.passwordHash) {
    const ok = await bcrypt.compare("password123", user.passwordHash);
    console.log("password match:", ok);
  }
}
main().finally(() => p.$disconnect());
