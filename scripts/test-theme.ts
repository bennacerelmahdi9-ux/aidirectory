/**
 * Quick check of the refactored ThemeProvider (useSyncExternalStore):
 * - initial theme comes from localStorage without hydration errors
 * - clicking the toggle updates <html class> and persists across reload
 */
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("http://localhost:3000/", { waitUntil: "load", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));

  const before = await page.evaluate(() => ({
    cls: document.documentElement.className,
    stored: localStorage.getItem("theme"),
  }));

  // Click the theme toggle button in the header (last header icon button).
  await page.evaluate(() => {
    const btn = document.querySelector("header button[aria-label], header button");
    const buttons = Array.from(document.querySelectorAll("header button"));
    const toggle = buttons.find((b) => b.querySelector("svg.lucide-moon, svg.lucide-sun"));
    (toggle ?? btn)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 800));

  const after = await page.evaluate(() => ({
    cls: document.documentElement.className,
    stored: localStorage.getItem("theme"),
  }));

  await page.reload({ waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 2500));
  const persisted = await page.evaluate(() => ({
    cls: document.documentElement.className,
    stored: localStorage.getItem("theme"),
  }));

  console.log(JSON.stringify({ before, after, persisted, errors }, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
