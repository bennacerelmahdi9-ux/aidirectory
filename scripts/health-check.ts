/**
 * Tool health checks (#5): verifies every approved tool's website still
 * responds and records the result on the tool (isDead / lastCheckedAt).
 *
 * Run manually or from a scheduler:
 *   npm run health-check            # all approved tools
 *   npm run health-check -- --only-dead   # re-check tools currently marked dead
 */
import { PrismaClient } from "@prisma/client";
import { isSiteAlive } from "../src/lib/health";

const prisma = new PrismaClient();
const onlyDead = process.argv.includes("--only-dead");

async function main() {
  const tools = await prisma.tool.findMany({
    where: {
      status: "APPROVED",
      ...(onlyDead ? { isDead: true } : {}),
    },
    select: { id: true, name: true, websiteUrl: true, isDead: true },
  });

  console.log(`Checking ${tools.length} tool${tools.length === 1 ? "" : "s"}${onlyDead ? " (dead only)" : ""}...`);

  let alive = 0;
  let dead = 0;
  for (const tool of tools) {
    const ok = await isSiteAlive(tool.websiteUrl);
    await prisma.tool.update({
      where: { id: tool.id },
      data: { isDead: !ok, lastCheckedAt: new Date() },
    });
    if (ok) {
      alive++;
      if (tool.isDead) console.log(`✓ ${tool.name} — back online`);
    } else {
      dead++;
      console.log(`✗ ${tool.name} — unreachable (${tool.websiteUrl})`);
    }
  }

  console.log(`Done. ${alive} alive, ${dead} dead, out of ${tools.length}.`);
  if (dead > 0) {
    console.log("Dead-link tools are flagged \"Site unavailable\" on their detail pages and in the admin panel.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
