import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://localhost:3001';
const baseline = process.argv.includes('--baseline');
const label = baseline ? 'before' : 'after';
const directory = new URL('../refinement-evidence/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const failures = [];
const results = [];
const errors = [];
try {
  const request = await browser.newContext();
  const xml = await (await request.request.get(`${base}/sitemap.xml`)).text();
  const paths = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
  for (const width of [360, 390, 820, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    for (const path of [...paths, '/sign-in', '/sign-up', '/not-a-real-page']) {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      const data = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        icons: [
          ...document.querySelectorAll(
            'svg, .icon-3d, .capgen-feature-icon, .capgen-step-icon, .float-ui-icon',
          ),
        ].filter((el) => !el.closest('.cl-rootBox')).length,
        emoji: /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u.test(
          document.body.innerText,
        ),
        h1: [...document.querySelectorAll('h1')].map((el) => el.textContent.trim()),
        brokenImages: [...document.images]
          .filter((img) => {
            const rect = img.getBoundingClientRect();
            return (
              rect.width &&
              rect.top < innerHeight &&
              rect.bottom > 0 &&
              (!img.complete || !img.naturalWidth)
            );
          })
          .map((img) => img.src),
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        background: getComputedStyle(document.querySelector('.hero-sky-layer') || document.body)
          .backgroundImage,
      }));
      results.push({ path, width, ...data });
      if (data.overflow) failures.push(`${path} at ${width}: horizontal overflow`);
      if (data.brokenImages.length) failures.push(`${path} at ${width}: broken images`);
      if (!baseline && (data.icons || data.emoji))
        failures.push(`${path} at ${width}: icons/emojis remain`);
      if (['/', '/templates', '/pricing'].includes(path) && [390, 1440].includes(width)) {
        await page.screenshot({
          path: new URL(
            `${label}-${path === '/' ? 'home' : path.slice(1)}-${width}.png`,
            directory,
          ).pathname.replace(/^\/(\w:)/, '$1'),
          fullPage: true,
        });
        if (path === '/')
          await page.locator('.capgen-cinematic-hero').screenshot({
            path: new URL(`${label}-hero-${width}.png`, directory).pathname.replace(
              /^\/(\w:)/,
              '$1',
            ),
          });
      }
      if (path === '/') {
        if (width === 390) {
          await page.getByRole('button', { name: 'Toggle Navigation Menu' }).click();
          if (!(await page.locator('#home-mobile-menu').isVisible()))
            failures.push('Home mobile menu did not open');
          await page
            .locator('#home-mobile-menu')
            .getByRole('link', { name: 'Features', exact: true })
            .click();
        }
        await page.getByRole('button', { name: 'Can I export SRT files?' }).click();
        if (
          !(await page.getByText('SRT contains text and cue times;', { exact: false }).isVisible())
        )
          failures.push('Home FAQ did not expand');
        await page
          .getByRole('button', { name: /Start Creating Now|Start Captioning/, exact: true })
          .first()
          .click();
        const dialog = page.getByRole('dialog', { name: 'Sign in to Capgen' });
        await dialog.waitFor();
        await page.keyboard.press('Escape');
        if (await dialog.isVisible()) failures.push('Auth modal did not close with Escape');
        if (
          !baseline &&
          !(await page
            .getByRole('button', { name: 'Start Captioning', exact: true })
            .first()
            .evaluate((el) => el === document.activeElement))
        )
          failures.push('Auth modal did not restore CTA focus');
      }
      if (!baseline && path === '/pricing' && width === 390) {
        const toggle = page.getByRole('switch', { name: 'Yearly billing' });
        await toggle.click();
        if (
          (await toggle.getAttribute('aria-checked')) !== 'false' ||
          !(await page.getByText('$14', { exact: true }).isVisible())
        )
          failures.push('Pricing billing toggle regressed');
      }
      if (!baseline && path === '/templates') {
        if ((await page.locator('[data-preset]').count()) !== 8)
          failures.push('Templates must show eight actual preset illustrations');
        if (
          (await page.getByRole('link', { name: 'Preview in Studio', exact: true }).count()) !== 8
        )
          failures.push('Templates Studio links missing');
      }
    }
    await context.close();
  }
  const movement = [];
  if (!baseline) {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      await context.addInitScript(() => {
        window.__capgenCls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            if (!entry.hadRecentInput) window.__capgenCls += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      const page = await context.newPage();
      await page.goto(base, { waitUntil: 'networkidle' });
      const positions = () =>
        page.locator('.caption-phone').evaluateAll((els) =>
          els.map((el) => {
            const rect = el.getBoundingClientRect();
            return { x: rect.x, right: rect.right, width: rect.width };
          }),
        );
      const before = await positions();
      await page.waitForTimeout(1200);
      const after = await positions();
      const shifts = after.map((card, index) => card.x - before[index].x);
      const visible = after
        .filter((card) => card.right > 0 && card.x < width)
        .sort((a, b) => a.x - b.x);
      const gaps = visible.slice(1).map((card, index) => card.x - visible[index].right);
      const performance = await page.evaluate(() => ({
        cls: window.__capgenCls,
        loadedResourceBytes: window.performance
          .getEntriesByType('resource')
          .reduce((total, entry) => total + entry.decodedBodySize, 0),
      }));
      movement.push({ width, shifts, gaps, visible: visible.length, performance });
      if (performance.cls > 0.1) failures.push(`Unexpected homepage layout shift at ${width}`);
      if (!shifts.some((shift) => shift > 10))
        failures.push(`Gallery must move left to right at ${width}`);
      if (gaps.some((gap) => gap < 25))
        failures.push(`Gallery cards must remain separated at ${width}`);
      if (await page.locator('.hero-cinematic-hero svg, .capgen-cinematic-hero svg').count())
        failures.push('Gallery icon remains');
      await page.locator('.capgen-style-card').first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      if (
        (await page
          .locator('.caption-orbit')
          .evaluate((el) => getComputedStyle(el).animationPlayState)) !== 'paused'
      )
        failures.push('Offscreen gallery decoration must pause');
      await context.close();
    }
  }
  await writeFile(
    new URL(`${label}.json`, directory),
    JSON.stringify({ results, movement, failures, errors }, null, 2),
  );
  console.log(JSON.stringify({ label, checks: results.length, failures, errors }, null, 2));
  if (failures.length || errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
