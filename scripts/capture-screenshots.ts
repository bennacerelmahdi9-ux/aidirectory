/**
 * Capture README screenshots of the running app (http://localhost:3000).
 * Uses the locally installed Chrome via puppeteer-core.
 * Output: docs/screenshots/*.png
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000";
const OUT = "docs/screenshots";

mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--window-size=1440,900"],
  });

async function shot(
  name: string,
  path: string,
  { login = false, fullPage = false }: { login?: boolean; fullPage?: boolean } = {},
) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  if (login) {
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.type('input[name="email"]', "admin@aiatlas.dev");
    await page.type('input[name="password"]', "password123");
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 30000 }).catch(() => {}),
    ]);
  }
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3500)); // let content + animations settle
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log(`✓ ${name}.png`);
  await page.close();
}

  try {
    // Public pages
    await shot("01-home", "/", { fullPage: false });
    await shot("02-tools", "/tools", { fullPage: false });
    await shot("03-tool-detail", "/tools/anthropic-api", { fullPage: false });
    await shot("04-compare", "/compare?ids=anthropic-api,grammarly", { fullPage: false });
    await shot("05-submit", "/submit", { login: true });
    await shot("06-admin", "/admin", { login: true });
    console.log("Done.");
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
