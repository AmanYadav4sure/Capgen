import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runTests() {
  console.log(`\n🚀 Starting Playwright E2E Tests on ${BASE_URL}\n`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  async function testPage(path, name, validations) {
    try {
      const url = `${BASE_URL}${path}`;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = response ? response.status() : 0;
      
      if (status >= 200 && status < 400) {
        await page.waitForTimeout(500);
        await validations(page);
        console.log(`✅ [PASSED] ${name} (${path}) - Status ${status}`);
        passed++;
      } else {
        console.error(`❌ [FAILED] ${name} (${path}) - Unexpected HTTP status ${status}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ [FAILED] ${name} (${path}) - Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Home Page Test
  await testPage('/', 'Home Page', async (page) => {
    const title = await page.title();
    if (!title) throw new Error('Home page title is missing');
    const heroHeading = await page.textContent('h1');
    if (!heroHeading) throw new Error('Hero heading h1 not found');
  });

  // 2. Sign In Page Test
  await testPage('/sign-in', 'Sign In Page', async (page) => {
    const heading = await page.textContent('h1');
    if (!heading.includes('Sign in')) throw new Error('Sign in heading incorrect');
    const googleBtn = await page.locator('button:has-text("Google")').isVisible();
    if (!googleBtn) throw new Error('Google sign-in button not found');
    const emailInput = await page.locator('input[type="email"]').isVisible();
    if (!emailInput) throw new Error('Email input field not found');
  });

  // 3. Sign Up Page Test
  await testPage('/sign-up', 'Sign Up Page', async (page) => {
    const heading = await page.textContent('h1');
    if (!heading.includes('Create your')) throw new Error('Sign up heading incorrect');
    const submitBtn = await page.locator('button[type="submit"]').isVisible();
    if (!submitBtn) throw new Error('Submit button not found');
  });

  // 4. Pricing Page Test
  await testPage('/pricing', 'Pricing Page', async (page) => {
    const bodyText = await page.textContent('body');
    if (!bodyText.toLowerCase().includes('plan') && !bodyText.toLowerCase().includes('pricing')) {
      throw new Error('Pricing content not found');
    }
  });

  // 5. Templates Page Test
  await testPage('/templates', 'Templates Page', async (page) => {
    const bodyText = await page.textContent('body');
    if (!bodyText.includes('Karaoke Pop') && !bodyText.toLowerCase().includes('template')) {
      throw new Error('Templates content not found');
    }
  });

  // 6. Terms Page Test
  await testPage('/terms', 'Terms of Service Page', async (page) => {
    const bodyText = await page.textContent('body');
    if (!bodyText.includes('Terms of Service')) throw new Error('Terms of service text missing');
  });

  // 7. Privacy Page Test
  await testPage('/privacy', 'Privacy Policy Page', async (page) => {
    const bodyText = await page.textContent('body');
    if (!bodyText.includes('Privacy Policy')) throw new Error('Privacy policy text missing');
  });

  // 8. Studio Editor Test
  await testPage('/editor', 'Studio Editor Page', async (page) => {
    const pageUrl = page.url();
    if (!pageUrl.includes('/editor') && !pageUrl.includes('/sign-in')) {
      throw new Error(`Unexpected navigation to ${pageUrl}`);
    }
  });

  await browser.close();

  console.log(`\n========================================`);
  console.log(`📊 Test Summary: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} tests`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
