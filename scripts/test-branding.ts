/**
 * End-to-end test of admin-configurable branding:
 * 1. Generate brand assets (A mark + OG banner) by rendering HTML in Chrome.
 * 2. Log in as admin, upload each via the admin panel file inputs.
 * 3. Verify the header logo, favicon <link>, and og:image <meta> appear.
 * 4. Verify /api/media/<id> serves the right content type.
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "http://localhost:3000";
const TMP = join(process.cwd(), ".tmp-branding");
mkdirSync(TMP, { recursive: true });

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });

  /* 1. Render brand assets with the app's own look */
  const page = await browser.newPage();

  // A mark (512x512)
  await page.setViewport({ width: 512, height: 512 });
  await page.setContent(
    `<body style="margin:0"><div style="width:512px;height:512px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:0"><span style="font:900 320px system-ui,sans-serif;color:#fff">A</span></div></body>`,
  );
  await page.screenshot({ path: join(TMP, "logo.png") });

  // OG banner (1200x630)
  await page.setViewport({ width: 1200, height: 630 });
  await page.setContent(
    `<body style="margin:0"><div style="width:1200px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;background:#0a0a0f;color:#fff;font-family:system-ui,sans-serif">
      <div style="display:flex;align-items:center;gap:20px">
        <div style="width:96px;height:96px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:20px"><span style="font:900 64px system-ui,sans-serif;color:#fff">A</span></div>
        <span style="font:800 72px system-ui,sans-serif;letter-spacing:-2px">AIAtlas</span>
      </div>
      <span style="font:400 30px system-ui,sans-serif;color:#9ca3af">Discover, compare, and explore the best AI tools</span>
    </div></body>`,
  );
  await page.screenshot({ path: join(TMP, "og.png") });
  console.log("✓ brand assets generated");

  /* 2. Log in and upload via the admin panel */
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/login`, { waitUntil: "load", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.type('input[name="email"]', "admin@aiatlas.dev");
  await page.type('input[name="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => !location.pathname.startsWith("/login"), { timeout: 30000 });
  console.log("✓ logged in");

  await page.goto(`${BASE}/admin`, { waitUntil: "load", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Stripe & API Keys"),
    );
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  async function upload(kind: string, file: string) {
    // Find the file input belonging to the form whose hidden kind input matches.
    const handles = await page.$$('input[type="file"]');
    let target: import("puppeteer-core").ElementHandle<HTMLInputElement> | null = null;
    for (const h of handles) {
      const kindVal = await h.evaluate((el) => {
        const f = el.closest("form");
        return (f?.querySelector('input[name="kind"]') as HTMLInputElement | null)?.value ?? "";
      });
      if (kindVal === kind) { target = h as never; break; }
    }
    if (!target) throw new Error(`${kind}: file input not found`);
    await (target as import("puppeteer-core").ElementHandle<HTMLInputElement>).uploadFile(file);
    await (target as unknown as import("puppeteer-core").ElementHandle<Element>).evaluate((el) => {
      const f = (el as HTMLInputElement).closest("form");
      const btn = f?.querySelector('button[type="submit"]') as HTMLElement | null;
      btn?.click();
    });
    await page.waitForFunction(
      () => document.querySelectorAll('[data-sonner-toast]').length > 0,
      { timeout: 20000 },
    );
    await new Promise((r) => setTimeout(r, 1200));
    // read current media id from the preview img
    const mediaId = await page.evaluate((k: string) => {
      const forms = Array.from(document.querySelectorAll("form"));
      const form = forms.find(
        (f) => (f.querySelector('input[name="kind"]') as HTMLInputElement | null)?.value === k,
      );
      const img = form?.closest("div")?.querySelector("img");
      return img?.getAttribute("src")?.replace("/api/media/", "") ?? null;
    }, kind);
    console.log(`✓ ${kind} uploaded -> media ${mediaId}`);
    return mediaId;
  }

  await upload("logo", join(TMP, "logo.png"));
  await page.reload({ waitUntil: "load" });
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Stripe & API Keys"),
    );
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  const faviconId = await upload("favicon", join(TMP, "logo.png"));
  const ogId = await upload("ogImage", join(TMP, "og.png"));
  void faviconId;
  void ogId;

  /* 3. Verify metadata + header on the homepage */
  await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));
  const check = await page.evaluate(() => ({
    headerLogo: document.querySelector('header img[src*="/api/media/"]')?.getAttribute("src") ?? null,
    iconLinks: Array.from(document.querySelectorAll('link[rel="icon"]')).map((l) => l.getAttribute("href")),
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? null,
  }));
  console.log("homepage metadata:", JSON.stringify(check));

  /* 4. Verify /favicon.ico serves the uploaded icon via the branding route */
  const favResp = await page.evaluate(async () => {
    const res = await fetch("/favicon.ico");
    return { status: res.status, type: res.headers.get("content-type"), cache: res.headers.get("cache-control") };
  });
  console.log("/favicon.ico:", JSON.stringify(favResp));

  /* 4. Verify the media route serves proper content */
  const mediaResp = await page.evaluate(async () => {
    const src = document.querySelector('header img[src*="/api/media/"]')?.getAttribute("src");
    if (!src) return null;
    const res = await fetch(src);
    return { status: res.status, type: res.headers.get("content-type"), cache: res.headers.get("cache-control") };
  });
  console.log("media route:", JSON.stringify(mediaResp));

  await browser.close();
  console.log("DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


