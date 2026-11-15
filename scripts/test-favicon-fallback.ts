import { prisma } from "../src/lib/prisma";
import { SETTING_KEYS } from "../src/lib/settings";

async function main() {
  // Clear the uploaded favicon to test the default fallback.
  await prisma.setting.upsert({
    where: { key: SETTING_KEYS.brandingFavicon },
    update: { value: "" },
    create: { key: SETTING_KEYS.brandingFavicon, value: "" },
  });
  const r = await fetch("http://localhost:3000/favicon.ico", { redirect: "follow" });
  console.log("fallback /favicon.ico:", r.status, r.headers.get("content-type"));
  // Restore the uploaded favicon for the live site.
  const last = await prisma.media.findFirst({ where: { kind: "favicon" }, orderBy: { createdAt: "desc" } });
  if (last) {
    await prisma.setting.upsert({
      where: { key: SETTING_KEYS.brandingFavicon },
      update: { value: last.id },
      create: { key: SETTING_KEYS.brandingFavicon, value: last.id },
    });
    console.log("restored favicon media:", last.id);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
