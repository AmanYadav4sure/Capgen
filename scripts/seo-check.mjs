import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://localhost:3100';
const canonicalOrigin = 'https://www.capgen.app';
const baseline = process.argv.includes('--baseline');
const label = baseline ? 'before' : process.env.SEO_EVIDENCE_LABEL || 'after';
const directory = new URL('../seo-evidence/', import.meta.url);
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const parser = await context.newPage();
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function parse(source, xml = false) {
  return parser.evaluate(
    ({ source, xml }) => {
      const doc = new DOMParser().parseFromString(source, xml ? 'application/xml' : 'text/html');
      if (xml)
        return {
          errors: doc.querySelectorAll('parsererror').length,
          urls: [...doc.querySelectorAll('loc')].map((el) => el.textContent),
          dates: [...doc.querySelectorAll('lastmod')].map((el) => el.textContent),
        };
      const metadata = (name) =>
        [...doc.querySelectorAll(`meta[name="${name}"]`)].map((el) => el.content);
      const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((el) => {
        try {
          return JSON.parse(el.textContent);
        } catch {
          return { invalid: true };
        }
      });
      doc.querySelectorAll('script,style,template,[hidden]').forEach((el) => el.remove());
      return {
        title: doc.querySelector('title')?.textContent,
        descriptions: metadata('description'),
        robots: metadata('robots'),
        googlebot: metadata('googlebot'),
        canonicals: [...doc.querySelectorAll('link[rel="canonical"]')].map((el) => el.href),
        ogUrl: doc.querySelector('meta[property="og:url"]')?.content,
        icon: doc.querySelector('link[rel="icon"]')?.getAttribute('href'),
        h1: [...doc.querySelectorAll('h1')].map((el) => el.textContent.trim()),
        mainCount: doc.querySelectorAll('main').length,
        words: (doc.body?.textContent || '').trim().split(/\s+/).length,
        links: [...doc.querySelectorAll('a[href]')].map((el) => el.getAttribute('href')),
        schemas,
      };
    },
    { source, xml },
  );
}

try {
  const sitemapResponse = await context.request.get(`${base}/sitemap.xml`);
  const sitemap = await parse(await sitemapResponse.text(), true);
  check(
    sitemapResponse.status() === 200 && !sitemap.errors,
    'Sitemap must be valid XML with status 200',
  );
  check(new Set(sitemap.urls).size === sitemap.urls.length, 'Duplicate sitemap URLs');
  const robotsResponse = await context.request.get(`${base}/robots.txt`);
  const robots = await robotsResponse.text();
  check(
    robotsResponse.status() === 200 && robots.includes(`${canonicalOrigin}/sitemap.xml`),
    'Robots sitemap reference/status',
  );
  const pages = [];
  const internal = new Set();
  for (const url of sitemap.urls) {
    const pathname = new URL(url).pathname;
    check(new URL(url).origin === canonicalOrigin, `Sitemap origin: ${url}`);
    const response = await context.request.get(`${base}${pathname}`, { maxRedirects: 0 });
    const html = await response.text();
    const data = await parse(html);
    pages.push({
      path: pathname,
      status: response.status(),
      bytes: Buffer.byteLength(html),
      ...data,
    });
    check(response.status() === 200, `${pathname}: HTTP ${response.status()}`);
    check(
      data.canonicals.length === 1 && data.canonicals[0] === url,
      `${pathname}: wrong/missing canonical`,
    );
    check(data.h1.length === 1, `${pathname}: needs one H1`);
    check(data.mainCount === 1, `${pathname}: needs one main landmark`);
    check(
      data.title && data.descriptions.length === 1 && data.descriptions[0].length > 40,
      `${pathname}: metadata missing`,
    );
    check(
      ![...data.robots, ...data.googlebot, response.headers()['x-robots-tag'] || ''].some((s) =>
        /noindex/i.test(s),
      ),
      `${pathname}: accidental noindex`,
    );
    check(data.ogUrl && new URL(data.ogUrl).href === url, `${pathname}: incorrect Open Graph URL`);
    check(
      data.schemas.every((schema) => !schema.invalid),
      `${pathname}: invalid JSON-LD`,
    );
    check(
      !html.includes('aggregateRating') && !html.includes('SearchAction'),
      `${pathname}: unsupported review/search schema`,
    );
    const entities = data.schemas.flatMap((schema) => schema['@graph'] || [schema]);
    check(
      entities.some((entity) => entity['@type'] === 'WebPage' && entity.url === url),
      `${pathname}: missing matching WebPage schema`,
    );
    check(
      entities.some((entity) => entity['@type'] === 'SoftwareApplication') === (pathname === '/'),
      `${pathname}: application schema scope`,
    );
    if (pathname !== '/') {
      const breadcrumb = entities.find((entity) => entity['@type'] === 'BreadcrumbList');
      check(
        breadcrumb?.itemListElement.at(-1)?.item === url,
        `${pathname}: breadcrumb destination`,
      );
      check(
        breadcrumb?.itemListElement.every(
          (item, i) => item.position === i + 1 && item.item.startsWith(canonicalOrigin),
        ),
        `${pathname}: breadcrumb positions/URLs`,
      );
    }
    for (const href of data.links) {
      const target = new URL(href, url);
      if (target.origin === canonicalOrigin) internal.add(target.pathname + target.search);
    }
  }
  check(new Set(pages.map((page) => page.title)).size === pages.length, 'Duplicate page titles');
  check(
    new Set(pages.map((page) => page.descriptions[0])).size === pages.length,
    'Duplicate descriptions',
  );
  const reachable = new Set(['/']);
  let previousSize = -1;
  while (reachable.size !== previousSize) {
    previousSize = reachable.size;
    for (const page of pages.filter((page) => reachable.has(page.path))) {
      for (const href of page.links) {
        const url = new URL(href, canonicalOrigin);
        if (url.origin === canonicalOrigin && pages.some((page) => page.path === url.pathname))
          reachable.add(url.pathname);
      }
    }
  }
  const orphans = pages.filter((page) => !reachable.has(page.path)).map((page) => page.path);
  check(!orphans.length, `Unreachable from home: ${orphans.join(', ')}`);
  const linkStatuses = [];
  for (const path of internal) {
    const response = await context.request.get(`${base}${path}`, { maxRedirects: 0 });
    linkStatuses.push({ path, status: response.status() });
    check(response.status() === 200, `Internal link ${path}: HTTP ${response.status()}`);
  }
  const privatePages = [];
  for (const path of ['/editor', '/profile', '/sign-in', '/sign-up']) {
    const response = await context.request.get(`${base}${path}`);
    const data = await parse(await response.text());
    privatePages.push({
      path,
      status: response.status(),
      robots: data.robots,
      googlebot: data.googlebot,
    });
    check(
      data.robots.some((s) => /noindex/i.test(s)) &&
        data.googlebot.every((s) => /noindex/i.test(s)),
      `${path}: private robots conflict`,
    );
    check(!sitemap.urls.includes(`${canonicalOrigin}${path}`), `${path}: private page in sitemap`);
    check(!robots.includes(`Disallow: ${path}`), `${path}: crawler cannot read noindex`);
  }
  const missing = await context.request.get(`${base}/seo-test-missing-page`, { maxRedirects: 0 });
  check(missing.status() === 404, 'Unknown page must return 404');
  const queryResponse = await context.request.get(`${base}/?utm_source=seo-check`);
  check(
    (await parse(await queryResponse.text())).canonicals[0] === `${canonicalOrigin}/`,
    'Tracking query canonical',
  );
  const googlebotResponse = await context.request.get(`${base}/`, {
    headers: { 'User-Agent': 'Googlebot' },
  });
  check(
    googlebotResponse.status() === 200 && (await googlebotResponse.text()).includes('<h1'),
    'Googlebot initial HTML access',
  );
  const iconUrl = `${base}${pages.find((page) => page.path === '/').icon}`;
  const iconResponse = await context.request.get(iconUrl);
  const iconSize = await parser.evaluate(
    (src) =>
      new Promise((resolve) => {
        const icon = new Image();
        icon.onload = () => resolve({ width: icon.naturalWidth, height: icon.naturalHeight });
        icon.onerror = () => resolve({ width: 0, height: 0 });
        icon.src = src;
      }),
    iconUrl,
  );
  check(
    iconResponse.status() === 200 && iconSize.width === iconSize.height && iconSize.width >= 48,
    'Crawlable square favicon',
  );

  const responsive = [];
  for (const width of [390, 820, 1440]) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('capgen_cookie_consent', 'essential-only');
      window.__seoMetrics = { lcp: 0, cls: 0, longTasks: 0 };
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) window.__seoMetrics.lcp = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            if (!entry.hadRecentInput) window.__seoMetrics.cls += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}
      try {
        new PerformanceObserver((list) => {
          window.__seoMetrics.longTasks += list.getEntries().length;
        }).observe({ type: 'longtask', buffered: true });
      } catch {}
    });
    for (const path of sitemap.urls.map((url) => new URL(url).pathname)) {
      await page.goto(`${base}${path}`, { waitUntil: 'load' });
      await page.waitForTimeout(path === '/' ? 1500 : 150);
      const data = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        h1: document.querySelector('h1')?.textContent,
        metrics: window.__seoMetrics,
        fontStylesheets: [...document.querySelectorAll('link[href*="fonts.googleapis.com"]')].map(
          (el) => el.href,
        ),
        images: [...document.images].filter(
          (el) =>
            el.getBoundingClientRect().width > 0 &&
            el.getBoundingClientRect().top < innerHeight &&
            (!el.complete || !el.naturalWidth),
        ).length,
      }));
      responsive.push({ path, ...data });
      check(data.scrollWidth <= width + 1, `${path}: overflow at ${width}px`);
      if (['/', '/platforms/instagram', '/features/srt-subtitles'].includes(path))
        await page.screenshot({
          path: new URL(
            `${label}-${path === '/' ? 'home' : path.split('/').pop()}-${width}.png`,
            directory,
          ).pathname.replace(/^\/(.:)/, '$1'),
          fullPage: true,
        });
    }
    await page.close();
  }
  const analytics = [];
  for (const choice of [null, 'essential-only', 'accepted']) {
    const consentContext = await browser.newContext();
    if (choice)
      await consentContext.addInitScript(
        (value) => localStorage.setItem('capgen_cookie_consent', value),
        choice,
      );
    const page = await consentContext.newPage();
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const tag = page.locator('script[src*="googletagmanager.com/gtag/js"]');
    if (choice === 'accepted') await tag.waitFor({ state: 'attached' });
    else await page.waitForTimeout(800);
    const present = (await tag.count()) > 0;
    analytics.push({ choice, loaded: present });
    check(present === (choice === 'accepted'), `Analytics consent: ${choice}`);
    await consentContext.close();
  }
  const report = {
    label,
    base,
    pages,
    sitemap,
    robots,
    privatePages,
    linkStatuses,
    orphans,
    responsive,
    analytics,
    iconSize,
    failures,
  };
  await writeFile(new URL(`${label}.json`, directory), JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        label,
        publicPages: pages.length,
        internalLinks: internal.size,
        failures,
        report: `seo-evidence/${label}.json`,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
if (failures.length && !baseline) process.exitCode = 1;
