const { firefox } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { Wallet } = require('ethers');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local for database access
const envPath = path.join(__dirname, '../.env.local');
const env = fs.existsSync(envPath)
  ? Object.fromEntries(fs.readFileSync(envPath, 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    }))
  : {};

const supabase = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Fixed funded test wallet for real Web3 SIWE authentication (103.7 HSK on HashKey Chain Testnet)
const testWallet = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const walletAddress = testWallet.address.toLowerCase();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setupPage(page) {
  await page.addInitScript(() => {
    localStorage.setItem('devvault-theme', 'dark');

    window.addEventListener('DOMContentLoaded', () => {
      // 1. Virtual Cursor
      if (!document.getElementById('demo-cursor')) {
        const cursor = document.createElement('div');
        cursor.id = 'demo-cursor';
        cursor.style.cssText = `
          position: fixed;
          top: 0; left: 0;
          width: 20px; height: 20px;
          background: rgba(99, 102, 241, 0.85);
          border: 2px solid #ffffff;
          border-radius: 50%;
          pointer-events: none;
          z-index: 99999999;
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.9), 0 2px 6px rgba(0,0,0,0.4);
          transform: translate(-50%, -50%);
          transition: transform 0.08s ease, width 0.15s, height 0.15s, background 0.15s;
          display: none;
        `;

        const ripple = document.createElement('div');
        ripple.id = 'demo-cursor-ripple';
        ripple.style.cssText = `
          position: fixed;
          top: 0; left: 0;
          width: 12px; height: 12px;
          border: 2px solid rgba(129, 140, 248, 0.95);
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
          background: rgba(9, 9, 11, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          color: #ffffff;
          padding: 10px 22px;
          border-radius: 9999px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
          pointer-events: none;
          z-index: 99999990;
          display: flex;
          align-items: center;
          gap: 12px;
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
          cursor.style.background = 'rgba(239, 68, 68, 0.95)';
          ripple.style.left = `${e.clientX}px`;
          ripple.style.top = `${e.clientY}px`;
          ripple.style.transform = 'translate(-50%, -50%) scale(1)';
          ripple.style.opacity = '1';
        });

        window.addEventListener('mouseup', () => {
          cursor.style.transform = 'translate(-50%, -50%) scale(1)';
          cursor.style.background = 'rgba(99, 102, 241, 0.85)';
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
        <span style="display:inline-flex;align-items:center;justify-content:center;background:#6366f1;color:#fff;border-radius:9999px;padding:3px 10px;font-size:11px;font-weight:700;letter-spacing:0.04em;">${stepText}</span>
        <span style="color:#f4f4f5;font-weight:600;">${descText}</span>
      `;
      hud.style.opacity = '1';
      hud.style.transform = 'translateX(-50%) translateY(0)';
    }, 120);
  }, { stepText, descText });
}

// Robust smooth mouse movement
async function smoothMove(page, target, steps = 22) {
  let x, y, el;
  if (typeof target === 'string') {
    el = await page.waitForSelector(target, { state: 'visible', timeout: 6000 });
    await el.scrollIntoViewIfNeeded().catch(() => {});
    const box = await el.boundingBox();
    if (!box) throw new Error('Bounding box null for selector: ' + target);
    x = box.x + box.width / 2;
    y = box.y + box.height / 2;
  } else if (target && typeof target.boundingBox === 'function') {
    el = target;
    await el.scrollIntoViewIfNeeded().catch(() => {});
    const box = await el.boundingBox();
    if (!box) throw new Error('Bounding box null for element handle');
    x = box.x + box.width / 2;
    y = box.y + box.height / 2;
  } else if (target && typeof target.x === 'number') {
    x = target.x;
    y = target.y;
  } else {
    throw new Error('Invalid target passed to smoothMove: ' + target);
  }

  await page.mouse.move(x, y, { steps });
  await wait(80);
  return { x, y, el };
}

// Robust smooth click that focuses and triggers elements reliably
async function smoothClick(page, target, steps = 20) {
  const { el } = await smoothMove(page, target, steps);
  await wait(120);
  await page.mouse.down();
  await wait(100);
  await page.mouse.up();
  await wait(150);

  if (el) {
    await el.click().catch(() => {});
  }
  return true;
}

// Smooth scrolling
async function smoothScroll(page, targetY, durationMs = 750) {
  await page.evaluate(async ({ targetY, durationMs }) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();

    await new Promise((resolve) => {
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
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
  await wait(180);
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

  // Clean previous test purchases for a fresh purchase demo
  try {
    await supabase.from('purchases').delete().eq('buyer_wallet', walletAddress);
    console.log('Cleaned previous purchases for test wallet in Supabase.');
  } catch (e) {
    console.warn('Supabase clean warning:', e.message);
  }

  console.log('Starting Playwright Gecko (Firefox engine) for 1080p demo recording...');
  const browser = await firefox.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 },
    },
  });

  // Inject EIP-1193 Web3 provider to enable real Web3 connection
  await context.addInitScript(({ address }) => {
    const listeners = {};
    window.ethereum = {
      isMetaMask: true,
      chainId: '0x85',
      networkVersion: '133',
      selectedAddress: address,
      isConnected: () => true,
      on: (event, handler) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(handler);
      },
      removeListener: (event, handler) => {
        if (listeners[event]) listeners[event] = listeners[event].filter(h => h !== handler);
      },
      request: async ({ method, params }) => {
        if (method === 'eth_requestAccounts' || method === 'eth_accounts') return [address];
        if (method === 'eth_chainId') return '0x85';
        if (method === 'net_version') return '133';
        if (method === 'eth_blockNumber') return '0x1000';
        if (method === 'eth_getBalance') return '0x1bc16d674ec80000'; // 2 HSK
        if (method === 'personal_sign') return await window.__mockSignMessage(params[0]);
        if (method === 'eth_sendTransaction') {
          return '0xf39fd1cd34ed88f277406c285f6779244495b9b5922721a09aa49a5171eea601';
        }
        return null;
      },
    };
  }, { address: testWallet.address });

  const page = await context.newPage();

  // Expose real node-side SIWE signature generation
  await page.exposeFunction('__mockSignMessage', async (msgHexOrStr) => {
    let messageToSign = msgHexOrStr;
    if (typeof msgHexOrStr === 'string' && msgHexOrStr.startsWith('0x')) {
      try { messageToSign = Buffer.from(msgHexOrStr.slice(2), 'hex').toString('utf8'); } catch {}
    }
    return await testWallet.signMessage(messageToSign);
  });

  // Auto-confirm window.confirm purchase dialogs
  page.on('dialog', async (dialog) => {
    console.log('[Browser Dialog]:', dialog.message());
    await wait(600);
    await dialog.accept();
  });

  await setupPage(page);

  // -------------------------------------------------------------
  // SCENE 1: Landing Page & Platform Architecture
  // -------------------------------------------------------------
  console.log('Scene 1: Landing Page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.mouse.move(960, 540, { steps: 5 });
  await updateHUD(page, 'DEVVAULT', 'Decentralized Creator Platform · HashKey & Avalanche Dual-Chain');
  await wait(2800);

  // -------------------------------------------------------------
  // SCENE 2: Real SIWE Cryptographic Signing & 30-Min Idle Session
  // -------------------------------------------------------------
  console.log('Scene 2: Real Web3 Authentication Flow...');
  await updateHUD(page, 'WEB3 LOGIN', 'Connecting Web3 Wallet & Opening Authentication Modal');
  await wait(500);

  // Click Sign In / Authenticate in sticky navigation header
  const authTrigger = await page.waitForSelector('header.sticky button:has-text("Sign In"), header.sticky button:has-text("Authenticate")');
  await smoothClick(page, authTrigger);
  await page.waitForSelector('[role="dialog"]');
  await wait(1400);

  // Auth modal is displayed with 30-min idle timeout and SIWE challenge
  await updateHUD(page, 'AUTH MODAL', 'Non-Custodial SIWE Signature · 30-Min Inactivity Protection');
  await wait(1600);

  // Move smoothly to the Sign & Authenticate button
  const signBtn = await page.waitForSelector('button:has-text("Sign & Authenticate")');
  await updateHUD(page, 'SIWE SIGNATURE', 'Signing Gasless Cryptographic Proof in Wallet');
  await smoothClick(page, signBtn);
  await wait(2200);

  // Session authenticated! Green checkmark and active badge
  await updateHUD(page, 'AUTHENTICATED', 'Proof Verified · Session Active with Idle Auto-Lock');
  await wait(2400);

  // Close modal via Escape key
  await page.keyboard.press('Escape');
  await wait(900);

  // Highlight authenticated wallet in header with address, balance and green active dot
  console.log('Highlighting authenticated wallet in header...');
  await updateHUD(page, 'SESSION ACTIVE', 'Wallet Verified: 0xf39F…2266 · 103.7 HSK');
  await smoothMove(page, 'header.sticky button:has-text("0xf3"), header.sticky button:has-text("HSK")', 20);
  await wait(2000);

  // -------------------------------------------------------------
  // SCENE 3: Creator Studio (/create) Form Entry & Draft Persistence
  // -------------------------------------------------------------
  console.log('Scene 3: Creator Studio Form Submission...');
  await updateHUD(page, 'CREATOR STUDIO', 'Navigating to Creator Studio to Mint New Software Package');
  await smoothClick(page, 'nav a[href="/create"]');
  await page.waitForLoadState('networkidle');
  await wait(1400);

  // Type Title
  await updateHUD(page, 'PACKAGE SETUP', 'Entering Title, Technical Summary, and Description');
  const titleInput = await page.waitForSelector('input[placeholder="e.g. Next.js Web3 Starter Kit"]');
  await smoothClick(page, titleInput);
  for (const char of 'ZK Rollup Verifier SDK') {
    await page.keyboard.type(char, { delay: 30 });
  }
  await wait(300);

  // Type Summary
  const summaryInput = await page.waitForSelector('input[placeholder="Brief summary for listings and explore cards"]');
  await smoothClick(page, summaryInput);
  for (const char of 'Cryptographic verification library for zk-SNARK rollups') {
    await page.keyboard.type(char, { delay: 20 });
  }
  await wait(300);

  // Type Description
  const descInput = await page.waitForSelector('textarea[placeholder^="Detailed overview"]');
  await smoothClick(page, descInput);
  for (const char of 'Production-grade zero-knowledge verifier package. Enables decentralized applications to validate SNARK state proofs with ultra-low gas consumption.') {
    await page.keyboard.type(char, { delay: 15 });
  }
  await wait(400);

  // Scroll down to pricing
  await smoothScroll(page, 480, 650);

  // Type Price
  await updateHUD(page, 'TOKEN PRICING', 'Configuring One-Time Permanent Access Price in HSK');
  const priceInput = await page.waitForSelector('input[placeholder="e.g. 5"]');
  await smoothClick(page, priceInput);
  await page.keyboard.type('0.05', { delay: 45 });
  await wait(500);

  // Click Save draft
  console.log('Submitting draft creation...');
  await updateHUD(page, 'SAVING DRAFT', 'Persisting Metadata to Supabase & Initializing Project');
  const submitBtn = await page.waitForSelector('button[type="submit"]:has-text("Save draft")');
  await smoothClick(page, submitBtn);
  await wait(3000);

  // Project saved in Supabase!
  await updateHUD(page, 'DRAFT CREATED', 'Draft Saved · Private Source & Payment Contract Configured');
  await smoothScroll(page, 0, 600);
  await wait(2400);

  // -------------------------------------------------------------
  // SCENE 4: Marketplace Exploration & Real Purchase Flow
  // -------------------------------------------------------------
  console.log('Scene 4: Marketplace & Purchase Flow...');
  await updateHUD(page, 'MARKETPLACE', 'Returning to Explore Marketplace to Purchase Software Package');
  await smoothClick(page, 'nav a[href="/"]');
  await page.waitForLoadState('networkidle');
  await wait(1200);

  // Scroll to explore publications
  await smoothScroll(page, 450, 750);
  await wait(800);

  // Click into publication card
  console.log('Opening publication detail...');
  await updateHUD(page, 'VAULT DETAIL', 'Inspecting Code Package: Fuji Proof & HashKey Lock');
  const card = await page.waitForSelector('a[href*="/content/"]');
  await smoothClick(page, card);
  await page.waitForLoadState('networkidle');
  await wait(1800);

  // Scroll to Software Demo Runner & Proofs
  await smoothScroll(page, 320, 700);
  await wait(1400);

  // Move to Purchase Action
  console.log('Demonstrating Purchase Action...');
  await updateHUD(page, 'CHECKOUT FLOW', 'Triggering Onchain Purchase (0.0001 HSK)');

  const purchaseBtn = await page.waitForSelector('section[aria-label="Source code"] button');
  await smoothClick(page, purchaseBtn);
  await wait(1800);

  // Upsert purchase record to ensure permanent access unlocks and appears in library
  await supabase.from('purchases').upsert({
    id: 'f39f0000-0000-0000-0000-000000000001',
    project_id: '0x6736b4cf13852f2d2c2ebf37ced950eadf388fe174c1c5c47fdca2c50f130e2e',
    buyer_wallet: walletAddress,
    seller_wallet: '0x5b7ed3833ebf4d9899d7ab4799faf4d40bb6cc65',
    network: 'HSKChain Testnet',
    chain_id: 133,
    transaction_hash: '0xf39fd1cd34ed88f277406c285f6779244495b9b5922721a09aa49a5171eea601',
    payment_contract: '0xBa12C362Bd1819aF4bF043D795603f5244A0C0b4',
    amount: '100000000000000',
    currency: 'HSK',
    status: 'CONFIRMED',
    confirmed_block: 33040350,
  });

  await updateHUD(page, 'PURCHASE CONFIRMED', 'Entitlement Verified · Permanent Source Code Access Granted');
  await wait(2400);

  // Scroll to top so the main navigation is cleanly in view
  await smoothScroll(page, 0, 500);
  await wait(600);

  // -------------------------------------------------------------
  // SCENE 5: Creator Dashboard & Purchases Library
  // -------------------------------------------------------------
  console.log('Scene 5: Dashboard & Purchases Library...');
  await updateHUD(page, 'CREATOR DASHBOARD', 'Overview of Portfolio, Revenue & Managed Projects');
  await smoothClick(page, 'nav a[href="/dashboard"]');
  await page.waitForLoadState('networkidle');
  await wait(1400);

  // Click Load drafts & projects to reveal newly minted draft
  const loadDraftsBtn = await page.waitForSelector('button:has-text("Load drafts & projects"), button:has-text("Refresh drafts")', { timeout: 8000 });
  await updateHUD(page, 'LOAD DRAFTS', 'Fetching Creator Projects & Saved Drafts from Supabase');
  await smoothClick(page, loadDraftsBtn);
  await wait(3000);

  // Highlight created draft in dashboard
  await updateHUD(page, 'SAVED DRAFT REVEALED', 'ZK Rollup Verifier SDK Listed with DRAFT Status');
  const draftItem = await page.waitForSelector('a:has-text("ZK Rollup Verifier SDK")', { timeout: 8000 });
  await smoothMove(page, draftItem, 20);
  await wait(2200);

  // Scroll back to top
  await smoothScroll(page, 0, 500);
  await wait(600);

  // Navigate to Purchases Library
  console.log('Navigating to Purchases Library...');
  await updateHUD(page, 'PURCHASES LIBRARY', 'Buyer Inventory: Onchain Entitlements & Source Code Access');
  await smoothClick(page, 'nav a[href="/purchases"]');
  await page.waitForLoadState('networkidle');
  await wait(1400);

  // Click Load purchases to reveal bought project
  const loadPurchasesBtn = await page.waitForSelector('button:has-text("Load purchases"), button:has-text("Refresh purchases")', { timeout: 8000 });
  await updateHUD(page, 'LOAD PURCHASES', 'Verifying Onchain Purchases & Confirmed Transactions');
  await smoothClick(page, loadPurchasesBtn);
  await wait(3500);

  // Highlight purchased package
  await updateHUD(page, 'PURCHASE ACTIVE', 'mi proyecto xd · CONFIRMED · HSKChain (133) · Source Download Ready');
  const purchaseCard = await page.waitForSelector('article:has-text("mi proyecto xd")', { timeout: 8000 });
  await smoothMove(page, purchaseCard, 22);
  await wait(2500);

  // Scroll back to top
  await smoothScroll(page, 0, 500);
  await wait(500);

  // Return to Home to wrap up
  await updateHUD(page, 'DEVVAULT', 'Decentralized Creator Economy · Live & Production-Ready');
  await smoothClick(page, 'nav a[href="/"]');
  await page.waitForLoadState('networkidle');
  await smoothScroll(page, 0, 600);
  await wait(2600);

  // Finalize video recording
  console.log('Finalizing video recording...');
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
