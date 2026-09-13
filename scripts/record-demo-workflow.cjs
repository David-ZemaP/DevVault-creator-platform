const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Helper: sleep
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setupPage(page) {
  // Inject custom virtual cursor and demo HUD badge
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      // 1. Virtual Cursor
      if (!document.getElementById('demo-cursor')) {
        const cursor = document.createElement('div');
        cursor.id = 'demo-cursor';
        cursor.style.cssText = `
          position: fixed;
          top: 0; left: 0;
          width: 22px; height: 22px;
          background: rgba(99, 102, 241, 0.65);
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          pointer-events: none;
          z-index: 99999999;
          box-shadow: 0 0 14px rgba(99, 102, 241, 0.8), 0 2px 6px rgba(0,0,0,0.4);
          transform: translate(-50%, -50%);
          transition: transform 0.1s ease, width 0.15s, height 0.15s, background 0.15s;
          display: none;
        `;

        const ripple = document.createElement('div');
        ripple.id = 'demo-cursor-ripple';
        ripple.style.cssText = `
          position: fixed;
          top: 0; left: 0;
          width: 12px; height: 12px;
          border: 2px solid rgba(129, 140, 248, 0.9);
          border-radius: 50%;
          pointer-events: none;
          z-index: 99999998;
          transform: translate(-50%, -50%) scale(1);
          opacity: 0;
          transition: transform 0.45s cubic-bezier(0, 0, 0.2, 1), opacity 0.45s cubic-bezier(0, 0, 0.2, 1);
        `;

        // 2. Demo HUD Caption Banner
        const hud = document.createElement('div');
        hud.id = 'demo-hud-banner';
        hud.style.cssText = `
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(9, 9, 11, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: #ffffff;
          padding: 10px 22px;
          border-radius: 9999px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
          pointer-events: none;
          z-index: 99999990;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0;
          transform: translateX(-50%) translateY(12px);
        `;

        document.body.appendChild(cursor);
        document.body.appendChild(ripple);
        document.body.appendChild(hud);

        window.addEventListener('mousemove', (e) => {
          cursor.style.display = 'block';
          cursor.style.left = `${e.clientX}px`;
          cursor.style.top = `${e.clientY}px`;
        });

        window.addEventListener('mousedown', (e) => {
          cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
          cursor.style.background = 'rgba(239, 68, 68, 0.9)';
          ripple.style.left = `${e.clientX}px`;
          ripple.style.top = `${e.clientY}px`;
          ripple.style.transform = 'translate(-50%, -50%) scale(1)';
          ripple.style.opacity = '1';
        });

        window.addEventListener('mouseup', () => {
          cursor.style.transform = 'translate(-50%, -50%) scale(1)';
          cursor.style.background = 'rgba(99, 102, 241, 0.65)';
          ripple.style.transform = 'translate(-50%, -50%) scale(4.5)';
          ripple.style.opacity = '0';
        });
      }
    });
  });
}

// Update HUD Banner
async function updateHUD(page, stepText, descText) {
  await page.evaluate(({ stepText, descText }) => {
    const hud = document.getElementById('demo-hud-banner');
    if (!hud) return;
    hud.style.opacity = '0';
    hud.style.transform = 'translateX(-50%) translateY(10px)';
    setTimeout(() => {
      hud.innerHTML = `
        <span style="display:inline-flex;align-items:center;justify-content:center;background:#6366f1;color:#fff;border-radius:9999px;padding:2px 8px;font-size:11px;font-weight:700;letter-spacing:0.04em;">${stepText}</span>
        <span style="color:#e4e4e7;font-weight:600;">${descText}</span>
      `;
      hud.style.opacity = '1';
      hud.style.transform = 'translateX(-50%) translateY(0)';
    }, 150);
  }, { stepText, descText });
}

// Smooth mouse movements
async function smoothMove(page, selectorOrPoint, steps = 25) {
  let x, y;
  if (typeof selectorOrPoint === 'string') {
    const el = await page.waitForSelector(selectorOrPoint, { state: 'visible', timeout: 5000 });
    const box = await el.boundingBox();
    if (!box) return;
    x = box.x + box.width / 2;
    y = box.y + box.height / 2;
  } else {
    x = selectorOrPoint.x;
    y = selectorOrPoint.y;
  }
  await page.mouse.move(x, y, { steps });
  await wait(100);
}

async function smoothClick(page, selector, steps = 20) {
  await smoothMove(page, selector, steps);
  await wait(150);
  await page.mouse.down();
  await wait(120);
  await page.mouse.up();
  await wait(200);
}

// Smooth scrolling
async function smoothScroll(page, targetY, durationMs = 800) {
  await page.evaluate(async ({ targetY, durationMs }) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();

    await new Promise((resolve) => {
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // easeInOutQuad
        const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        window.scrollTo(0, startY + diff * ease);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }, { targetY, durationMs });
  await wait(200);
}

(async () => {
  const outputDir = path.join(__dirname, '../public/recordings');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clear previous webm/mp4 recordings
  const existingFiles = fs.readdirSync(outputDir);
  for (const f of existingFiles) {
    if (f.endsWith('.webm') || f.endsWith('.mp4')) {
      try { fs.unlinkSync(path.join(outputDir, f)); } catch {}
    }
  }

  console.log('Starting Playwright browser for 1080p demo recording...');
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  await setupPage(page);

  // -------------------------------------------------------------
  // SCENE 1: Landing Page & Hero Introduction
  // -------------------------------------------------------------
  console.log('Scene 1: Landing Page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.mouse.move(960, 540, { steps: 5 });
  await updateHUD(page, 'DEVVAULT DEMO', 'Decentralized Creator Platform & Software Marketplace');
  await wait(2500);

  // -------------------------------------------------------------
  // SCENE 2: Dynamic Theme Switcher (Dark & Light Mode with Logo Change)
  // -------------------------------------------------------------
  console.log('Scene 2: Theme Switcher...');
  await updateHUD(page, 'THEME ENGINE', 'Seamless Dark & Light Mode with Dynamic Brand Logo');
  await wait(1000);

  // Move to Theme Toggle button in header
  await smoothClick(page, 'button[title*="mode"], button[aria-label*="mode"]');
  console.log('Switched to Light Mode');
  await wait(2000); // Let viewer inspect light mode and black logo!

  // Hover over the brand logo to show interactivity
  await smoothMove(page, 'a[aria-label="DevVault home"]', 20);
  await wait(800);

  // Switch back to Dark Mode
  await smoothClick(page, 'button[title*="mode"], button[aria-label*="mode"]');
  console.log('Switched back to Dark Mode');
  await wait(1500);

  // -------------------------------------------------------------
  // SCENE 3: Web3 Authentication & 30-Minute Security Model
  // -------------------------------------------------------------
  console.log('Scene 3: Auth Modal & Security Model...');
  await updateHUD(page, 'WEB3 AUTH', 'Interactive SIWE Auth Modal with 30-Minute Idle Session Lock');
  await wait(800);

  // Click Sign In button in header or hero
  const signInButton = await page.$('header button:has-text("Sign In")');
  if (signInButton) {
    await smoothClick(page, 'header button:has-text("Sign In")');
  } else {
    await smoothClick(page, 'button:has-text("Sign In")');
  }
  await wait(1500);

  // The AuthModal is now open!
  // Highlight the 30-minute security feature card
  const securityCard = await page.$('text=Automatic 30-Minute Security Lock');
  if (securityCard) {
    await smoothMove(page, 'text=Automatic 30-Minute Security Lock', 25);
    await wait(1800);
  }

  // Hover over Connect with Web3 button
  const connectBtn = await page.$('button:has-text("Connect with Web3")');
  if (connectBtn) {
    await smoothMove(page, 'button:has-text("Connect with Web3")', 20);
    await wait(1000);
  }

  // Close the modal via Escape key or Close button
  console.log('Closing Auth Modal...');
  await page.keyboard.press('Escape');
  await wait(1000);

  // -------------------------------------------------------------
  // SCENE 4: Marketplace Discovery & Dynamic Filtering
  // -------------------------------------------------------------
  console.log('Scene 4: Marketplace Exploration & Filtering...');
  await updateHUD(page, 'MARKETPLACE', 'Explore Verified Creator Vaults, Filter & Real-Time Search');
  await smoothScroll(page, 420, 1000);
  await wait(800);

  // Try the search bar
  const searchInput = await page.$('input[placeholder*="Search"]');
  if (searchInput) {
    await smoothClick(page, 'input[placeholder*="Search"]');
    await wait(300);
    // Type slowly
    for (const char of 'proyecto') {
      await page.keyboard.type(char, { delay: 100 });
    }
    await wait(1200);
    // Clear search
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Backspace');
      await wait(60);
    }
    await wait(600);
  }

  // Filter chips (All, Subscriptions, Lifetime)
  const filterBtns = await page.$$('button:has-text("Lifetime"), button:has-text("Subscription"), button:has-text("All")');
  if (filterBtns.length > 1) {
    for (let i = 0; i < Math.min(filterBtns.length, 3); i++) {
      const box = await filterBtns[i].boundingBox();
      if (box) {
        await smoothClick(page, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
        await wait(700);
      }
    }
  }

  // Hover over the first publication card
  const firstCard = await page.$('a[href^="/content/"]');
  if (firstCard) {
    await smoothMove(page, 'a[href^="/content/"]', 20);
    await wait(1000);
  }

  // -------------------------------------------------------------
  // SCENE 5: Vault Detail Page & Software Demo Runner
  // -------------------------------------------------------------
  console.log('Scene 5: Vault Detail Page...');
  await updateHUD(page, 'VAULT DETAIL', 'Inspecting Code Vault, Dynamic Token Pricing & Interactive Demo');
  if (firstCard) {
    await smoothClick(page, 'a[href^="/content/"]');
    await page.waitForLoadState('networkidle');
    await wait(1500);

    // Scroll down to showcase Demo runner and details
    await smoothScroll(page, 350, 900);
    await wait(1500);

    // Scroll back up
    await smoothScroll(page, 0, 800);
    await wait(1000);
  }

  // -------------------------------------------------------------
  // SCENE 6: Creator Studio (/create)
  // -------------------------------------------------------------
  console.log('Scene 6: Creator Studio...');
  await updateHUD(page, 'CREATOR STUDIO', 'Publish Software, Smart Contracts & Configure Token Monetization');
  await smoothClick(page, 'header a[href="/create"]');
  await page.waitForLoadState('networkidle');
  await wait(1500);

  // Fill in sample creator inputs to show interactive form
  const titleInput = await page.$('input[placeholder*="title" i], input[name*="title" i]');
  if (titleInput) {
    await smoothClick(page, titleInput);
    await page.keyboard.type('Zero-Knowledge Rollup Verifier SDK', { delay: 60 });
    await wait(500);
  }

  // Scroll through Creator Studio options
  await smoothScroll(page, 450, 900);
  await wait(1500);
  await smoothScroll(page, 0, 700);
  await wait(1000);

  // -------------------------------------------------------------
  // SCENE 7: Creator Dashboard (/dashboard) & Purchases (/purchases)
  // -------------------------------------------------------------
  console.log('Scene 7: Creator Dashboard & Purchases...');
  await updateHUD(page, 'CREATOR DASHBOARD', 'Revenue Metrics, Published Vaults & Active Subscribers');
  await smoothClick(page, 'header a[href="/dashboard"]');
  await page.waitForLoadState('networkidle');
  await wait(2000);

  // Purchases
  await updateHUD(page, 'PURCHASES LIBRARY', 'Decentralized License Ownership & Instant Source Download');
  await smoothClick(page, 'header a[href="/purchases"]');
  await page.waitForLoadState('networkidle');
  await wait(2000);

  // -------------------------------------------------------------
  // SCENE 8: Developer Documentation (/docs) & Grand Finale
  // -------------------------------------------------------------
  console.log('Scene 8: Docs & Wrap Up...');
  await updateHUD(page, 'DOCUMENTATION', 'Comprehensive Architecture, SIWE & Smart Contract Docs');
  // Scroll down to footer to click Docs link
  await smoothScroll(page, 600, 800);
  await wait(500);
  await smoothClick(page, 'footer a[href="/docs"]');
  await page.waitForLoadState('networkidle');
  await wait(1800);
  await smoothScroll(page, 400, 900);
  await wait(1500);

  // Return to Home
  await updateHUD(page, 'DEVVAULT', 'Production-Ready Web3 Creator Platform');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await smoothScroll(page, 0, 800);
  await wait(2500);

  // Finish video
  console.log('Closing browser context to finalize video recording...');
  const video = page.video();
  await context.close();
  await browser.close();

  if (video) {
    const webmFile = await video.path();
    const mp4File = path.join(outputDir, 'devvault-demo-walkthrough.mp4');
    console.log(`Converting ${webmFile} to MP4 (${mp4File})...`);
    execSync(`ffmpeg -y -i "${webmFile}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p "${mp4File}"`, { stdio: 'inherit' });
    console.log(`\nDemo video generated successfully!`);
    console.log(`Location: ${mp4File}`);
  } else {
    console.error('No video object found.');
  }
})().catch((err) => {
  console.error('Error during demo walkthrough recording:', err);
  process.exit(1);
});
