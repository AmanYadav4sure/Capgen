/**
 * IndexNow ping script — notifies Bing, Yandex, and other IndexNow-enabled
 * search engines about new or updated URLs. Run after every deploy:
 *
 *   node scripts/indexnow.mjs
 *
 * The key file must be live at https://www.capgen.app/<key>.txt first (it is
 * served from public/ once this repo is deployed). The apex domain redirects
 * to www, so IndexNow submissions use www — the host that actually serves pages.
 */
const SITE = 'https://www.capgen.app';
const KEY = 'b195cc512d5b40543e4289d617dc07a7';

const URLS = [
  `${SITE}/`,
  `${SITE}/pricing`,
  `${SITE}/templates`,
  `${SITE}/use-cases`,
  `${SITE}/use-cases/creators`,
  `${SITE}/use-cases/podcasters`,
  `${SITE}/use-cases/agencies`,
  `${SITE}/use-cases/education`,
  `${SITE}/platforms/instagram`,
  `${SITE}/platforms/youtube`,
  `${SITE}/platforms/tiktok`,
  `${SITE}/platforms/linkedin`,
  `${SITE}/about`,
  `${SITE}/contact`,
];

const ENDPOINTS = ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow'];

async function ping(endpoint) {
  const body = JSON.stringify({
    host: new URL(SITE).host,
    key: KEY,
    keyLocation: `${SITE}/${KEY}.txt`,
    urlList: URLS,
  });
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body,
  });
  console.log(`${endpoint} -> ${res.status}`);
}

async function main() {
  // Verify the key file is live before pinging (IndexNow rejects pings when it isn't).
  const keyRes = await fetch(`${SITE}/${KEY}.txt`);
  if (!keyRes.ok || (await keyRes.text()).trim() !== KEY) {
    console.error(`Key file not live yet at ${SITE}/${KEY}.txt — deploy first, then re-run.`);
    process.exit(1);
  }
  await Promise.all(ENDPOINTS.map(ping));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
