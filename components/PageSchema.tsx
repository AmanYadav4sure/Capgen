import { getRouteSeo, SITE_URL } from '@/lib/seo';

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export default function PageSchema({ path }: { path: string }) {
  const seo = getRouteSeo(path);
  if (!seo) return null;
  const url = `${SITE_URL}${path}`;
  const parent = path.startsWith('/use-cases/') ? '/use-cases' : null;
  const crumbs = [
    { name: 'Capgen', url: `${SITE_URL}/` },
    ...(parent ? [{ name: 'Use cases', url: `${SITE_URL}${parent}` }] : []),
    ...(path === '/' ? [] : [{ name: seo.title, url }]),
  ];
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': `${url}#webpage`,
            url,
            name: seo.title,
            description: seo.description,
            isPartOf: { '@id': `${SITE_URL}/#website` },
            ...(path !== '/' ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
          },
          ...(path === '/'
            ? [
                {
                  '@type': 'SoftwareApplication',
                  '@id': `${SITE_URL}/#software`,
                  name: 'Capgen',
                  url,
                  applicationCategory: 'MultimediaApplication',
                  operatingSystem: 'Web browser',
                  description:
                    'Generate timed captions from video audio, customize caption styles and animations, and export captioned video or SRT subtitles.',
                  offers: {
                    '@type': 'Offer',
                    name: 'Free account with 5 video credits',
                    price: '0',
                    priceCurrency: 'USD',
                    url: `${SITE_URL}/pricing`,
                  },
                  publisher: { '@id': `${SITE_URL}/#organization` },
                },
              ]
            : [
                {
                  '@type': 'BreadcrumbList',
                  '@id': `${url}#breadcrumb`,
                  itemListElement: crumbs.map((crumb, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    name: crumb.name,
                    item: crumb.url,
                  })),
                },
              ]),
        ],
      }}
    />
  );
}
