import { chromium } from 'playwright';
import { copyFile, mkdir, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const videoRoot = resolve(scriptDir, '..');
const workDir = join(videoRoot, 'work');
const rawDir = join(workDir, 'raw');
const outputPath = join(workDir, 'guided-demo-capture.webm');
const demoUrl = process.env.DEMO_URL || 'http://127.0.0.1:5173/?demo=1';

const wait = (page, seconds) => page.waitForTimeout(seconds * 1000);

function cardMarkup({ eyebrow, title, subtitle, columns = [] }) {
  const items = columns.map((column) => `
    <section class="card-column">
      <strong>${column.title}</strong>
      <p>${column.copy}</p>
    </section>
  `).join('');
  return `<!doctype html>
  <html lang="en"><head><meta charset="utf-8"><style>
    :root{font-family:Arial,sans-serif;color:#2b1711;background:#fff4ea}
    *{box-sizing:border-box}body{margin:0;width:100vw;height:100vh;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 50% 45%,#fffaf5 0,#fff4ea 68%,#ffe2d2 100%)}
    main{width:min(1480px,88vw);text-align:center}.eyebrow{color:#ff5a36;font:bold 24px monospace;letter-spacing:.16em}.title{margin:22px 0 14px;font:900 clamp(72px,8vw,150px)/.9 monospace;letter-spacing:-.07em;text-transform:uppercase;text-shadow:8px 8px 0 #ffc0a7}.subtitle{margin:0 auto;color:#795449;font:700 clamp(24px,2.3vw,42px)/1.3 monospace;max-width:1200px}
    .columns{display:grid;grid-template-columns:repeat(${Math.max(1, columns.length)},1fr);gap:22px;margin-top:54px}.card-column{padding:28px;border:3px solid #ff5a36;border-radius:20px;background:rgba(255,255,255,.72);box-shadow:10px 10px 0 #ffd3c0;text-align:left}.card-column strong{display:block;color:#ff5a36;font:900 27px monospace}.card-column p{margin:12px 0 0;font:700 22px/1.35 monospace;color:#51372f}
  </style></head><body><main><div class="eyebrow">${eyebrow}</div><h1 class="title">${title}</h1><p class="subtitle">${subtitle}</p><div class="columns">${items}</div></main></body></html>`;
}

async function showCard(page, card, seconds) {
  await page.setContent(cardMarkup(card), { waitUntil: 'load' });
  await wait(page, seconds);
}

async function openGuidedDemo(page) {
  const tip = page.getByText('TIP 1 OF 8', { exact: true });
  const launchButtons = page.getByRole('button', { name: 'VIEW GUIDED DEMO', exact: true });
  try {
    await page.waitForFunction(() => {
      const text = document.body?.innerText || '';
      return text.includes('TIP 1 OF 8') || text.includes('VIEW GUIDED DEMO');
    }, undefined, { timeout: 15000 });

    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (await tip.isVisible().catch(() => false)) return;

      const count = await launchButtons.count();
      for (let index = 0; index < count; index += 1) {
        const button = launchButtons.nth(index);
        if (await button.isVisible().catch(() => false)) {
          await button.click().catch(() => undefined);
          break;
        }
      }
      await wait(page, 0.5);
    }

    await tip.waitFor({ state: 'visible', timeout: 1000 });
  } catch (error) {
    const diagnosticPath = join(workDir, 'guided-demo-entry-failure.png');
    await page.screenshot({ path: diagnosticPath, fullPage: true });
    const details = {
      url: page.url(),
      title: await page.title().catch(() => ''),
      text: (await page.locator('body').innerText().catch(() => '')).slice(0, 600),
      screenshot: diagnosticPath,
    };
    throw new Error(`Guided demo did not open. ${JSON.stringify(details, null, 2)}`, { cause: error });
  }
}

await rm(rawDir, { recursive: true, force: true });
await mkdir(rawDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: rawDir, size: { width: 1920, height: 1080 } },
  colorScheme: 'light',
  reducedMotion: 'no-preference',
});
const page = await context.newPage();
const video = page.video();

await showCard(page, {
  eyebrow: 'OPENAI BUILD WEEK · APPS FOR YOUR LIFE',
  title: 'PLANK AS ONE',
  subtitle: 'ONE PLANK · ONE PIXEL · ONE SHARED CANVAS',
}, 10);

const response = await page.goto(demoUrl, { waitUntil: 'domcontentloaded' });
if (!response?.ok()) throw new Error(`Demo page returned HTTP ${response?.status() ?? 'unknown'}: ${demoUrl}`);
await page.addStyleTag({ content: 'html{scrollbar-width:none}body::-webkit-scrollbar{display:none}' });
await openGuidedDemo(page);
await wait(page, 15);

await page.getByRole('button', { name: 'LET ME CHOOSE' }).click();
await wait(page, 2);
await page.locator('.cell.target:not([disabled])').first().click();
await page.getByText('TIP 2 OF 8', { exact: true }).waitFor();
await wait(page, 11);

await page.getByRole('button', { name: 'SIMULATE READY POSITION' }).click();
await page.getByText('TIP 3 OF 8', { exact: true }).waitFor();
await wait(page, 6);
await page.getByRole('button', { name: 'CONTINUE COUNTDOWN' }).click();
await page.getByText('TIP 4 OF 8', { exact: true }).waitFor({ timeout: 8000 });
await wait(page, 8);

await page.getByRole('button', { name: 'SIMULATE HIPS TOO LOW' }).click();
await page.getByText('TIP 5 OF 8', { exact: true }).waitFor();
await wait(page, 6);

await page.getByRole('button', { name: 'SIMULATE HIPS TOO HIGH' }).click();
await page.getByText('TIP 6 OF 8', { exact: true }).waitFor();
await wait(page, 6);

await page.getByRole('button', { name: 'SIMULATE OUT OF FRAME' }).click();
await page.getByText('TIP 7 OF 8', { exact: true }).waitFor();
await wait(page, 6);

await page.getByRole('button', { name: 'RETURN TO FRAME' }).click();
await page.getByText('TIP 8 OF 8', { exact: true }).waitFor();
await wait(page, 6);
await page.getByRole('button', { name: 'COMPLETE DEMO' }).click();
await page.getByText('YOUR DEMO PIXEL IS LIVE', { exact: true }).waitFor({ timeout: 8000 });
await wait(page, 4);

await showCard(page, {
  eyebrow: 'NON-TRIVIAL IMPLEMENTATION',
  title: 'PRIVATE BY DESIGN',
  subtitle: 'Camera analysis stays in the browser; only anonymous canvas lifecycle events reach the shared backend.',
  columns: [
    { title: 'ON DEVICE', copy: 'TensorFlow.js MoveNet → confidence gate → smoothing and form rules' },
    { title: 'STATE MACHINE', copy: 'Readiness → countdown → grace → pause → recovery → completion' },
    { title: 'SHARED CANVAS', copy: 'Supabase atomic reservation, collision handling, release, and realtime updates' },
  ],
}, 42);

await showCard(page, {
  eyebrow: 'BUILT DURING OPENAI BUILD WEEK',
  title: 'CODEX + GPT-5.6',
  subtitle: 'Engineering acceleration with human product, safety, privacy, and design decisions.',
  columns: [
    { title: 'CODEX ACCELERATED', copy: 'Architecture, implementation, debugging, tests, deployment, and release review' },
    { title: 'HUMANS DECIDED', copy: 'The ritual, pixel-first flow, honor mode, thresholds, safety language, and visual identity' },
  ],
}, 34);

await showCard(page, {
  eyebrow: 'A SMALL EFFORT BECOMES VISIBLE COMPANY',
  title: 'PLANK AS ONE',
  subtitle: 'ONE PLANK · ONE PIXEL · ONE CANVAS',
}, 23);

await context.close();
await browser.close();
const recordedPath = await video.path();
await mkdir(dirname(outputPath), { recursive: true });
await copyFile(recordedPath, outputPath);
console.log(`Captured guided demo: ${outputPath}`);
