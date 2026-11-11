import { PrismaClient } from "@prisma/client";
import { fetchFavicon } from "../src/lib/favicon";

const prisma = new PrismaClient();

async function main() {
  const tools = await prisma.tool.findMany({
    where: { logo: null },
    select: { id: true, name: true, websiteUrl: true },
  });

  console.log(`Backfilling favicons for ${tools.length} tools...`);

  let updated = 0;
  for (const tool of tools) {
    const logo = await fetchFavicon(tool.websiteUrl);
    if (logo) {
      await prisma.tool.update({ where: { id: tool.id }, data: { logo } });
      console.log(`✓ ${tool.name} -> ${logo}`);
      updated++;
    } else {
      console.log(`✗ ${tool.name} — no favicon found`);
    }
  }

  console.log(`Done. ${updated}/${tools.length} tools updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
