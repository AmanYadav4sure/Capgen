import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://localhost:3001';
const directory = new URL('../quality-evidence/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const checks = [],
  failures = [],
  runtimeErrors = [],
  policyViolations = [];
const check = (ok, label) => {
  checks.push({ label, passed: !!ok });
  if (!ok) failures.push(label);
};
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => {
  localStorage.setItem('capgen_cookie_consent', 'essential-only');
  window.__policyViolations = [];
  document.addEventListener('securitypolicyviolation', (event) =>
    window.__policyViolations.push(
      event.effectiveDirective + ': ' + new URL(event.blockedURI, location.origin).origin,
    ),
  );
});
try {
  const page = await context.newPage();
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  const x = await page
    .locator('.caption-phone')
    .first()
    .evaluate((el) => el.getBoundingClientRect().x);
  await page.waitForTimeout(1000);
  check(
    (await page
      .locator('.caption-phone')
      .first()
      .evaluate((el) => el.getBoundingClientRect().x)) > x,
    'Existing hero gallery continues left to right',
  );
  const cta = page.getByRole('button', { name: 'Start Captioning', exact: true }).first();
  await cta.click();
  const dialog = page.getByRole('dialog', { name: 'Sign in to Capgen' });
  await dialog.waitFor();
  await dialog.locator('input[name=identifier]').waitFor({ timeout: 30000 });
  check(true, 'Homepage sign-in modal loads the real Clerk component');
  await page.keyboard.press('Escape');
  check(!(await dialog.isVisible()), 'Clerk sign-in modal closes with Escape');
  check(
    await cta.evaluate((el) => el === document.activeElement),
    'Sign-in modal restores CTA focus',
  );
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + '/sign-in', { waitUntil: 'networkidle' });
    await page.locator('input[name=identifier]').waitFor({ timeout: 30000 });
    check(
      (await page.getByRole('heading', { name: 'Sign in to Capgen', exact: true }).count()) === 1,
      'Sign-in identity preserved at ' + width,
    );
    check(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      'No sign-in overflow at ' + width,
    );
    await page.screenshot({
      path: new URL('clerk-sign-in-' + width + '.png', directory).pathname.replace(
        /^\/(\w:)/,
        '$1',
      ),
      fullPage: true,
    });
    policyViolations.push(...(await page.evaluate(() => window.__policyViolations)));
  }
  await page.goto(base + '/sign-up', { waitUntil: 'networkidle' });
  await page.locator('.cl-signUp-root').waitFor({ timeout: 30000 });
  check(true, 'Create-account route loads Clerk without creating a user');
  await page.goto(base + '/profile', { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Sign in to view your projects' }).waitFor();
  check(true, 'Guest history explains sign-in instead of exposing account data');
  await page.goto(base + '/editor', { waitUntil: 'networkidle' });
  check(await page.locator('.ed-root').isVisible(), 'Guest Studio preview remains usable');
  for (const [path, method] of [
    ['/api/profile', 'GET'],
    ['/api/projects', 'GET'],
    ['/api/projects/private', 'GET'],
    ['/api/projects/private', 'DELETE'],
    ['/api/projects/private/export', 'POST'],
    ['/api/transcribe', 'POST'],
  ]) {
    const response = await context.request.fetch(base + path, { method });
    check(
      response.status() === 401,
      'Real Clerk-authenticated API rejects guest ' + method + ' ' + path,
    );
  }
  const origin = await context.request.post(base + '/api/projects', {
    headers: { origin: 'https://attacker.example' },
    data: {},
  });
  check(origin.status() === 403, 'Cross-origin writes remain forbidden');
  for (const path of ['/api/auth/send-code', '/api/auth/verify']) {
    const response = await context.request.post(base + path, {
      data: { code: '123456', email: 'nobody@example.test' },
    });
    check(
      response.status() === 410 && !response.headers()['set-cookie'],
      'Retired endpoint cannot issue a legacy session: ' + path,
    );
  }
  const forged = await context.request.get(base + '/api/profile', {
    headers: { cookie: 'capgen_session=forged.signature' },
  });
  check(forged.status() === 401, 'Old or forged custom session cookies grant no authority');
  check(policyViolations.length === 0, 'Clerk sign-in has no observed CSP violations');
} catch (error) {
  failures.push(error.message);
} finally {
  await writeFile(
    new URL('clerk-browser.json', directory),
    JSON.stringify(
      {
        fixture:
          'Real Clerk development SDK, signed-out only. No Clerk users, login emails, payments or live account mutations.',
        checks,
        failures,
        runtimeErrors,
        policyViolations,
        manual: [
          'User requested to test interactive sign-in personally; authenticated browser workflows remain unverified.',
        ],
      },
      null,
      2,
    ),
  );
  await browser.close();
}
console.log(
  JSON.stringify({ checks: checks.length, failures, runtimeErrors, policyViolations }, null, 2),
);
if (failures.length || runtimeErrors.length) process.exitCode = 1;
