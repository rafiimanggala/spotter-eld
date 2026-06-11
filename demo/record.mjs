import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = 'https://frontend-lac-alpha-42.vercel.app';
const OUT = join(__dirname, 'output');

const wait = ms => new Promise(r => setTimeout(r, ms));

const DUR = {
  intro: 8800, validation: 7400, autocomplete: 7400,
  locations: 6100, cycle: 8500, calculate: 3200,
  processing: 12900, overview: 9400, map: 9500,
  timeline: 9200, logsheets: 11100, logdetail: 11300,
  transitions: 11100, download: 9600, outro: 13500,
};

/** Returns base + random(0, base*0.3) for varied timing */
function naturalPause(base) {
  return base + Math.random() * base * 0.3;
}

/**
 * Human-like mouse movement with slight path curvature,
 * cubic bezier easing, and micro-jitter at the end.
 */
async function smoothMove(page, toX, toY, ms = 500) {
  const from = await page.evaluate(() => {
    const c = document.getElementById('cur');
    return { x: parseFloat(c?.dataset.x || 640), y: parseFloat(c?.dataset.y || 400) };
  });

  const dx = toX - from.x;
  const dy = toY - from.y;

  // 1-2 random perpendicular offsets for path curvature
  const dist = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / (dist || 1);
  const perpY = dx / (dist || 1);

  // Control points with slight perpendicular offset (±10-30px)
  const offset1 = (Math.random() - 0.5) * 2 * (10 + Math.random() * 20);
  const offset2 = (Math.random() - 0.5) * 2 * (10 + Math.random() * 20);
  const cp1 = { x: from.x + dx * 0.33 + perpX * offset1, y: from.y + dy * 0.33 + perpY * offset1 };
  const cp2 = { x: from.x + dx * 0.66 + perpX * offset2, y: from.y + dy * 0.66 + perpY * offset2 };

  const steps = Math.max(15, Math.ceil(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    // Cubic bezier easing (ease-in-out)
    const ease = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Cubic bezier interpolation through control points
    const u = 1 - ease;
    const x = u * u * u * from.x + 3 * u * u * ease * cp1.x + 3 * u * ease * ease * cp2.x + ease * ease * ease * toX;
    const y = u * u * u * from.y + 3 * u * u * ease * cp1.y + 3 * u * ease * ease * cp2.y + ease * ease * ease * toY;

    await page.mouse.move(x, y);
    await wait(16);
  }

  // Micro-jitter at destination (hand tremor, ±2px)
  const jx = toX + (Math.random() - 0.5) * 4;
  const jy = toY + (Math.random() - 0.5) * 4;
  await page.mouse.move(jx, jy);
  await wait(30);
  await page.mouse.move(toX, toY);
}

/**
 * Subtle idle micro-movements simulating a user "reading" content.
 * Moves cursor ±3-8px in random directions every ~200-400ms.
 */
async function idleWiggle(page, ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const cur = await page.evaluate(() => {
      const c = document.getElementById('cur');
      return { x: parseFloat(c?.dataset.x || 640), y: parseFloat(c?.dataset.y || 400) };
    });
    const rx = cur.x + (Math.random() - 0.5) * 2 * (3 + Math.random() * 5);
    const ry = cur.y + (Math.random() - 0.5) * 2 * (3 + Math.random() * 5);
    await page.mouse.move(rx, ry);
    await wait(200 + Math.random() * 200);
  }
}

async function clickAt(page, x, y) {
  await smoothMove(page, x, y);
  await page.evaluate(([cx, cy]) => {
    const r = document.getElementById('cfx');
    r.style.left = cx + 'px'; r.style.top = cy + 'px';
    r.className = ''; void r.offsetHeight; r.className = 'pop';
  }, [x, y]);
  await page.mouse.click(x, y);
  await wait(200);
}

/** Click slightly off-center (±3-8px) to look more human */
async function clickEl(page, loc) {
  const box = await loc.boundingBox();
  if (!box) return;
  const offX = (Math.random() - 0.5) * 2 * (3 + Math.random() * 5);
  const offY = (Math.random() - 0.5) * 2 * (3 + Math.random() * 5);
  const cx = Math.min(Math.max(box.x + box.width / 2 + offX, box.x + 2), box.x + box.width - 2);
  const cy = Math.min(Math.max(box.y + box.height / 2 + offY, box.y + 2), box.y + box.height - 2);
  await clickAt(page, cx, cy);
}

async function typeSlowly(page, text, delay = 70) {
  for (const ch of text) {
    await page.keyboard.type(ch);
    await wait(delay + Math.random() * 30);
  }
}

async function scroll(page, dy, ms = 1500) {
  const steps = Math.ceil(ms / 30);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps);
    await wait(30);
  }
  await wait(300);
}

async function fillLocation(page, name, text) {
  const input = page.locator(`input[name="${name}"]`);
  await clickEl(page, input);
  await wait(400);
  await typeSlowly(page, text);
  await wait(2500);
  await page.keyboard.press('ArrowDown');
  await wait(600);
  await page.keyboard.press('Enter');
  await wait(800);
}

(async () => {
  mkdirSync(OUT, { recursive: true });
  console.log('Launching browser...');

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
  });
  const page = await ctx.newPage();

  console.log('Loading site...');
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });

  // Inject macOS cursor + click effect (NO caption overlay)
  await page.evaluate(() => {
    const s = document.createElement('style');
    s.textContent = `
      #cur {
        position: fixed; z-index: 999999; pointer-events: none;
        left: 640px; top: 400px;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,.25));
      }
      #cfx {
        position: fixed; z-index: 999998; pointer-events: none;
        width: 22px; height: 22px; border-radius: 50%;
        border: 2px solid rgba(59,130,246,.6);
        transform: translate(-50%,-50%) scale(0); opacity: 0;
      }
      #cfx.pop { animation: cfxA .35s ease-out forwards; }
      @keyframes cfxA {
        0% { transform: translate(-50%,-50%) scale(.4); opacity: 1; }
        100% { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
      }
    `;
    document.head.appendChild(s);

    const cur = document.createElement('div');
    cur.id = 'cur';
    cur.dataset.x = '640'; cur.dataset.y = '400';
    cur.innerHTML = `<svg width="17" height="23" viewBox="0 0 17 23" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.02 1.39L1.02 18.96L5.24 14.08L8.93 21.42L11.46 20.22L7.76 12.92L13.73 12.14L1.02 1.39Z"
            fill="#000" stroke="#fff" stroke-width="1.15" stroke-linejoin="round"/>
    </svg>`;
    document.body.appendChild(cur);

    const fx = document.createElement('div');
    fx.id = 'cfx';
    document.body.appendChild(fx);

    document.addEventListener('mousemove', e => {
      cur.style.left = e.clientX + 'px';
      cur.style.top = e.clientY + 'px';
      cur.dataset.x = String(e.clientX);
      cur.dataset.y = String(e.clientY);
    });
  });

  const t0 = Date.now();
  const timestamps = [];
  function mark(name) {
    const ts = ((Date.now() - t0) / 1000).toFixed(2);
    timestamps.push({ name, ts });
    console.log(`  [${ts}s] ${name}`);
  }

  console.log('Recording demo...');

  // ===== 01: INTRO — show empty state =====
  await wait(1500);
  mark('01_intro');
  // Slowly move cursor around the form to show the UI
  await smoothMove(page, 400, 200, 1200);
  await wait(800);
  await smoothMove(page, 600, 350, 1400);
  await wait(800);
  await smoothMove(page, 400, 500, 1200);
  await wait(800);
  await smoothMove(page, 700, 300, 1000);
  await idleWiggle(page, DUR.intro - 2000);

  // ===== 02: VALIDATION — click submit empty =====
  mark('02_validation');
  const submitBtn = page.locator('button[type="submit"]');
  await clickEl(page, submitBtn);
  await wait(1500);
  // Point at the error message
  await smoothMove(page, 400, 470, 800);
  await idleWiggle(page, DUR.validation);

  // ===== 03: AUTOCOMPLETE — start typing =====
  mark('03_autocomplete');
  await wait(500);

  // ===== 04: LOCATIONS — fill all three with pauses =====
  console.log('  Filling current location...');
  await fillLocation(page, 'current_location', 'Denver, CO');
  await wait(1000);

  console.log('  Filling pickup location...');
  mark('04_locations');
  await fillLocation(page, 'pickup_location', 'Kansas City, MO');
  await wait(1000);

  console.log('  Filling dropoff location...');
  await fillLocation(page, 'dropoff_location', 'Chicago, IL');
  await wait(1500);

  // ===== 05: CYCLE — set hours =====
  mark('05_cycle');
  const cycleInput = page.locator('input[name="cycle_used"]');
  await clickEl(page, cycleInput);
  await page.keyboard.press('Meta+a');
  await wait(300);
  await typeSlowly(page, '25', 120);
  await wait(1500);
  // Hover over the progress bar to show it
  await smoothMove(page, 500, 530, 800);
  await smoothMove(page, 700, 530, 1000);
  await wait(DUR.cycle - 2000);

  // ===== 06: CALCULATE =====
  mark('06_calculate');
  await clickEl(page, submitBtn);
  await wait(800);

  // ===== 07: PROCESSING — wait for results =====
  mark('07_processing');
  const section07Start = Date.now();
  try {
    await page.waitForSelector('.leaflet-container', { timeout: 45000 });
    console.log('  Results loaded!');
  } catch {
    console.log('  Waiting for results...');
    await wait(10000);
  }
  await wait(3500);
  // Ensure minimum section duration for narration
  const elapsed07 = Date.now() - section07Start;
  if (elapsed07 < DUR.processing) await wait(DUR.processing - elapsed07);

  // ===== 08: OVERVIEW — show stat cards =====
  mark('08_overview');
  // Hover over stat cards
  await smoothMove(page, 250, 300, 800);
  await wait(1000);
  await smoothMove(page, 450, 300, 800);
  await wait(1000);
  await smoothMove(page, 650, 300, 800);
  await wait(1000);
  await smoothMove(page, 850, 300, 800);
  await wait(1000);
  await smoothMove(page, 450, 300, 800);
  await idleWiggle(page, DUR.overview - 2000);

  // ===== 09: MAP =====
  mark('09_map');
  await scroll(page, 400, 1800);
  await wait(1500);
  // Hover over map markers
  await smoothMove(page, 400, 400, 1000);
  await wait(800);
  await smoothMove(page, 600, 350, 1000);
  await wait(800);
  await smoothMove(page, 800, 380, 1000);
  await wait(1500);
  await smoothMove(page, 500, 450, 1200);
  await wait(1500);
  await scroll(page, 200, 800);
  await wait(2000);

  // ===== 10: TIMELINE =====
  mark('10_timeline');
  await scroll(page, 450, 1800);
  await wait(1500);
  // Slowly scan the stops
  await smoothMove(page, 300, 300, 800);
  await smoothMove(page, 300, 400, 1000);
  await smoothMove(page, 300, 500, 1000);
  await smoothMove(page, 600, 400, 800);
  await idleWiggle(page, DUR.timeline - 2000);

  // ===== 11: LOG SHEETS =====
  mark('11_logsheets');
  await scroll(page, 500, 1800);
  await wait(2000);
  // Hover over the log sheet header area
  await smoothMove(page, 300, 250, 800);
  await wait(1000);
  await smoothMove(page, 700, 250, 1200);
  await idleWiggle(page, DUR.logsheets - 3000);

  // ===== 12: LOG DETAIL — scan across the log grid =====
  mark('12_logdetail');
  // Sweep cursor across the 24-hour timeline
  await smoothMove(page, 150, 380, 600);
  await wait(500);
  await smoothMove(page, 500, 380, 1500);
  await wait(500);
  await smoothMove(page, 900, 380, 1500);
  await wait(500);
  // Sweep down the status rows
  await smoothMove(page, 500, 320, 800);
  await smoothMove(page, 500, 360, 600);
  await smoothMove(page, 500, 400, 600);
  await smoothMove(page, 500, 440, 600);
  await wait(800);
  await smoothMove(page, 200, 380, 1000);
  await smoothMove(page, 1000, 380, 2000);
  await wait(DUR.logdetail - 4000);

  // ===== 13: TRANSITIONS — show dots and remarks =====
  mark('13_transitions');
  await scroll(page, 250, 1000);
  await wait(1500);
  // Point at diagonal remarks area
  await smoothMove(page, 300, 450, 800);
  await smoothMove(page, 600, 420, 1200);
  await smoothMove(page, 800, 400, 1000);
  await wait(DUR.transitions - 1500);

  // ===== 14: DOWNLOAD =====
  mark('14_download');
  const dlBtn = page.locator('button:has-text("Download")').first();
  try {
    await dlBtn.waitFor({ state: 'visible', timeout: 2000 });
    await clickEl(page, dlBtn);
    await wait(1500);
  } catch { /* skip */ }
  // Scroll to more log sheets
  await scroll(page, 600, 2000);
  await wait(2000);
  // Hover over second log sheet
  await smoothMove(page, 400, 350, 1000);
  await smoothMove(page, 800, 350, 1500);
  await wait(1500);
  await scroll(page, 400, 1500);
  await wait(2000);

  // ===== 15: OUTRO — scroll back to top =====
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await wait(3000);
  mark('15_outro');
  // Final cursor sweep over the app
  await smoothMove(page, 400, 300, 1000);
  await smoothMove(page, 640, 400, 1200);
  await wait(DUR.outro + 2000);

  // Save
  const videoPath = await page.video().path();
  await ctx.close();
  await browser.close();

  writeFileSync(join(OUT, 'timestamps.txt'), timestamps.map(t => `${t.name} ${t.ts}`).join('\n'));

  console.log(`\nVideo: ${videoPath}`);
  console.log('Timestamps:', timestamps);
  console.log('Done!');
})();
