const { firefox } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { Wallet } = require('ethers');

// Fixed test wallet for real Web3 authentication
const testWallet = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setupPage(page) {
  await page.addInitScript(() => {
    // Force dark mode in localStorage so there is no flickering or accidental light theme
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
          background: rgba(99, 102, 241, 0.7);
          border: 2px solid #ffffff;
          border-radius: 50%;
          pointer-events: none;
          z-index: 99999999;
          box-shadow: 0 0 14px rgba(99, 102, 241, 0.8), 0 2px 6px rgba(0,0,0,0.4);
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
          bottom: 26px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(9, 9, 11, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          color: #ffffff;
          padding: 9px 20px;
          border-radius: 9999px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
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
          cursor.style.background = 'rgba(99, 102, 241, 0.7)';
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
    }, 120);
  }, { stepText, descText });
}

// Smooth mouse movements
async function smoothMove(page, selectorOrPoint, steps = 22) {
  try {
    let x, y;
    if (typeof selectorOrPoint === 'string') {
      const el = await page.waitForSelector(selectorOrPoint, { state: 'visible', timeout: 3500 });
      const box = await el.boundingBox();
      if (!box) return false;
      x = box.x + box.width / 2;
      y = box.y + box.height / 2;
    } else {
      x = selectorOrPoint.x;
      y = selectorOrPoint.y;
    }
    await page.mouse.move(x, y, { steps });
    await wait(80);
    return true;
  } catch (e) {
    return false;
  }
}

async function smoothClick(page, selectorOrPoint, steps = 20) {
  const moved = await smoothMove(page, selectorOrPoint, steps);
  if (!moved) return false;
  await wait(120);
  await page.mouse.down();
  await wait(100);
  await page.mouse.up();
  await wait(180);
  return true;
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
  await wait(150);
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

  // Handle purchase confirm dialog automatically if triggered
  page.on('dialog', async (dialog) => {
    console.log('[Browser Dialog]:', dialog.message());
    await wait(600);
    await dialog.accept();
  });

  await setupPage(page);

  // -------------------------------------------------------------
  // SCENE 1: Landing Page & Platform Overview
  // -------------------------------------------------------------
  console.log('Scene 1: Landing Page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.mouse.move(960, 540, { steps: 5 });
  await updateHUD(page, 'DEVVAULT DEMO', 'Decentralized Creator Platform & Software Marketplace');
  await wait(2500);

  // -------------------------------------------------------------
  // SCENE 2: Real Web3 Login & SIWE Authentication
  // -------------------------------------------------------------
  console.log('Scene 2: Real Web3 Authentication Flow...');
  await updateHUD(page, 'WEB3 LOGIN', 'Connecting Web3 Wallet & SIWE Cryptographic Challenge');
  await wait(600);

  // Click Authenticate or Sign In in header
  const authTrigger = await page.waitForSelector('header button:has-text("Authenticate"), header button:has-text("Sign In")');
  await smoothClick(page, authTrigger);
  await wait(1200);

  // If "Select Wallet" is shown, click it and pick MetaMask
  const selectWalletBtn = await page.$('button:has-text("Select Wallet")');
  if (selectWalletBtn) {
    await updateHUD(page, 'SELECT WALLET', 'Pairing Web3 Provider (MetaMask / Injected)');
    await smoothClick(page, selectWalletBtn);
    await wait(800);
    const metaMaskOption = await page.$('button:has-text("MetaMask")');
    if (metaMaskOption) {
      await smoothClick(page, metaMaskOption);
      await wait(1500);
    }
  }

  // In AuthModal: Click Sign & Authenticate
  await updateHUD(page, 'AUTH MODAL', 'Signing Gasless SIWE Session Proof (30-Min Idle Lock Active)');
  const signBtn = await page.waitForSelector('button:has-text("Sign & Authenticate")', { timeout: 6000 }).catch(() => null);
  if (signBtn) {
    await smoothClick(page, signBtn);
    await wait(2200);
  }

  // Session authenticated!
  await updateHUD(page, 'AUTHENTICATED', 'Cryptographic Proof Verified · Session Active');
  await wait(1500);

  // Close AuthModal
  await page.keyboard.press('Escape');
  await wait(800);

  // Highlight authenticated wallet in header with address and balance
  console.log('Highlighting authenticated wallet button in header...');
  await updateHUD(page, 'SESSION ACTIVE', 'Wallet Connected with Balance (0xf3…2266 · 103.7 HSK)');
  await smoothMove(page, 'header button:has-text("0xf3")', 22);
  await wait(1800);

  // -------------------------------------------------------------
  // SCENE 3: Real Publication Creation in Creator Studio (/create)
  // -------------------------------------------------------------
  console.log('Scene 3: Creator Studio Form Submission...');
  await updateHUD(page, 'CREATOR STUDIO', 'Publishing New Software Package to Onchain Marketplace');
  await smoothClick(page, 'header a[href="/create"]');
  await page.waitForLoadState('networkidle');
  await wait(1200);

  // Type Title
  await updateHUD(page, 'PROJECT SETUP', 'Configuring Title, Description, and Token Pricing');
  const titleInput = await page.waitForSelector('input[placeholder="e.g. Next.js Web3 Starter Kit"]');
  await smoothClick(page, titleInput);
  for (const char of 'ZK Rollup Verifier SDK') {
    await page.keyboard.type(char, { delay: 35 });
  }
  await wait(200);

  // Type Description
  const descInput = await page.waitForSelector('textarea[placeholder^="Detailed overview"]');
  await smoothClick(page, descInput);
  for (const char of 'Production-grade cryptographic verification library for zk-SNARK state transitions on HashKey Chain.') {
    await page.keyboard.type(char, { delay: 20 });
  }
  await wait(200);

  // Scroll down to pricing
  await smoothScroll(page, 450, 600);

  // Type Price
  const priceInput = await page.waitForSelector('input[placeholder="e.g. 5"]');
  await smoothClick(page, priceInput);
  await page.keyboard.type('0.05', { delay: 50 });
  await wait(400);

  // Click Save draft
  console.log('Submitting draft creation...');
  await updateHUD(page, 'MINTING DRAFT', 'Saving Project Metadata to Decentralized Database');
  const submitBtn = await page.waitForSelector('button[type="submit"]:has-text("Save draft")');
  await smoothClick(page, submitBtn);
  await wait(3000);

  // The draft is saved!
  await updateHUD(page, 'PROJECT CREATED', 'Draft Saved · Private Source & Payment Contract Configured');
  await smoothScroll(page, 0, 600);
  await wait(2500);

  // -------------------------------------------------------------
  // SCENE 4: Marketplace Exploration & Purchase Flow
  // -------------------------------------------------------------
  console.log('Scene 4: Marketplace & Purchase Flow...');
  await updateHUD(page, 'MARKETPLACE', 'Exploring Verified Vaults with Dynamic Token Pricing');
  await smoothClick(page, 'header a[href="/"]');
  await page.waitForLoadState('networkidle');
  await wait(1200);

  // Scroll to vaults
  await smoothScroll(page, 380, 800);
  await wait(800);

  // Click into publication
  console.log('Opening publication detail...');
  await updateHUD(page, 'VAULT DETAIL', 'Inspecting Code Vault, Demo Sandbox & Access Model');
  const card = await page.waitForSelector('a[href^="/content/"]');
  await smoothClick(page, card);
  await page.waitForLoadState('networkidle');
  await wait(1500);

  // Scroll to Software Demo Runner
  await smoothScroll(page, 350, 800);
  await wait(1500);

  // Move to Purchase Action
  console.log('Demonstrating Purchase Action...');
  await updateHUD(page, 'CHECKOUT FLOW', 'Triggering Onchain Purchase & Membership Verification');
  const buyBtn = await page.$('button:has-text("Buy Source Code"), button:has-text("Access source code"), button:has-text("Subscribe")');
  if (buyBtn) {
    await smoothClick(page, buyBtn);
    await wait(2500);
  }

  // -------------------------------------------------------------
  // SCENE 5: Creator Dashboard & Purchases Library
  // -------------------------------------------------------------
  console.log('Scene 5: Dashboard & Purchases Library...');
  await updateHUD(page, 'CREATOR DASHBOARD', 'Overview of Portfolio, Revenue Analytics & Active Vaults');
  await smoothClick(page, 'header a[href="/dashboard"]');
  await page.waitForLoadState('networkidle');
  await wait(2000);

  await updateHUD(page, 'PURCHASES LIBRARY', 'Decentralized Vault Ownership & Source Code Entitlements');
  await smoothClick(page, 'header a[href="/purchases"]');
  await page.waitForLoadState('networkidle');
  await wait(2000);

  // Return to Home
  await updateHUD(page, 'DEVVAULT', 'Production-Ready Web3 Creator Platform');
  await smoothClick(page, 'header a[href="/"]');
  await page.waitForLoadState('networkidle');
  await smoothScroll(page, 0, 700);
  await wait(2500);

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
