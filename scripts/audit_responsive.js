const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DEVICES = [
  { name: 'iphone-se', width: 375, height: 667, type: 'phone' },
  { name: 'iphone-14-pro', width: 393, height: 852, type: 'phone' },
  { name: 'pixel-7', width: 412, height: 915, type: 'phone' },
  { name: 'z-fold-closed', width: 344, height: 882, type: 'foldable-closed' },
  { name: 'z-fold-open', width: 768, height: 960, type: 'foldable-open' },
  { name: 'ipad-mini', width: 744, height: 1133, type: 'tablet' },
  { name: 'ipad-pro', width: 1024, height: 1366, type: 'tablet' },
  { name: 'laptop-1280', width: 1280, height: 800, type: 'desktop' },
  { name: 'desktop-1920', width: 1920, height: 1080, type: 'desktop' },
];

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'editor', path: '/editor' },
  { name: 'pricing', path: '/pricing' },
  { name: 'profile', path: '/profile' },
  { name: 'templates', path: '/templates' },
];

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'responsive-audits');

async function runAudit() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log('Falling back to system installed Chrome...');
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  }

  const results = [];

  console.log('🚀 Starting Playwright Multi-Device Responsiveness Audit...\n');

  for (const dev of DEVICES) {
    console.log(`📱 Testing Device: ${dev.name} (${dev.width}x${dev.height}) [${dev.type}]`);
    const context = await browser.newContext({
      viewport: { width: dev.width, height: dev.height },
      deviceScaleFactor: 2,
      isMobile: dev.type.includes('phone') || dev.type.includes('foldable-closed'),
      hasTouch: dev.type !== 'desktop',
    });

    const page = await context.newPage();

    for (const pg of PAGES) {
      const url = `http://localhost:3000${pg.path}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1000);


        // Check for horizontal overflow
        const overflow = await page.evaluate(() => {
          const scrollWidth = document.documentElement.scrollWidth;
          const innerWidth = window.innerWidth;
          const overflowingElements = [];
          
          if (scrollWidth > innerWidth) {
            const allElements = document.querySelectorAll('*');
            allElements.forEach((el) => {
              const rect = el.getBoundingClientRect();
              if (rect.right > innerWidth + 2) {
                overflowingElements.push({
                  tag: el.tagName,
                  className: el.className ? el.className.toString().substring(0, 50) : '',
                  right: rect.right,
                  width: rect.width,
                });
              }
            });
          }

          return {
            hasOverflow: scrollWidth > innerWidth + 2,
            scrollWidth,
            innerWidth,
            overflowCount: overflowingElements.length,
            overflowingElements: overflowingElements.slice(0, 5),
          };
        });

        const screenshotFileName = `${dev.name}_${pg.name}.png`;
        const screenshotPath = path.join(OUTPUT_DIR, screenshotFileName);
        await page.screenshot({ path: screenshotPath, fullPage: pg.name === 'home' || pg.name === 'pricing' });

        const status = overflow.hasOverflow ? '❌ OVERFLOW' : '✅ OK';
        console.log(`   └─ Page: ${pg.name.padEnd(10)} -> ${status} (Width: ${overflow.innerWidth}px, ScrollWidth: ${overflow.scrollWidth}px)`);

        results.push({
          device: dev.name,
          deviceType: dev.type,
          viewport: `${dev.width}x${dev.height}`,
          page: pg.name,
          path: pg.path,
          hasOverflow: overflow.hasOverflow,
          scrollWidth: overflow.scrollWidth,
          innerWidth: overflow.innerWidth,
          overflowingElements: overflow.overflowingElements,
          screenshot: `/responsive-audits/${screenshotFileName}`,
        });
      } catch (err) {
        console.error(`   └─ Page: ${pg.name} FAILED to load:`, err.message);
      }
    }

    await context.close();
  }

  await browser.close();

  const reportPath = path.join(OUTPUT_DIR, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log('\n✅ Audit completed! Report saved to:', reportPath);
}

runAudit().catch(console.error);
