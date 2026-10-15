import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button, SectionTitle, Shell } from '@/components/site';
import PageSchema from '@/components/PageSchema';
import { landingContent, LANDING_ROUTES } from '@/lib/landingContent';
import { getLandingMetadata, getRouteSeo } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return getLandingMetadata(`/${slug.join('/')}`);
}

export function generateStaticParams() {
  return LANDING_ROUTES.map((route) => ({ slug: route.slice(1).split('/') }));
}

// Unknown routes use notFound; keep dynamicParams enabled for Next's catch-all prerendering.
export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = `/${slug.join('/')}`;
  const data = landingContent[path];
  if (!data) notFound();
  return (
    <Shell>
      <PageSchema path={path} />
      <section className={`hero inner-hero ${data.kind}`}>
        <div className="hero-content">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600">
            <Link href="/">Capgen</Link>
            {path.startsWith('/use-cases/') && (
              <>
                {' '}
                / <Link href="/use-cases">Use cases</Link>
              </>
            )}
            <span> / {data.eyebrow.toLowerCase()}</span>
          </nav>
          <span className="eyebrow">{data.eyebrow}</span>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
          <div className="hero-actions">
            <Button href={path === '/contact' ? 'mailto:support@capgen.app' : '/editor'}>
              {path === '/contact' ? 'Email support' : 'Open the caption studio'}
            </Button>
          </div>
        </div>
      </section>
      <section className="section">
        <SectionTitle eyebrow={data.eyebrow} title={data.section} />
        <div className="detail-grid">
          {data.cards.map(([title, copy]) => (
            <article className="detail-card" key={title}>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section split">
        <div>
          <SectionTitle
            eyebrow={
              path === '/contact'
                ? 'BEFORE YOU EMAIL'
                : path === '/about'
                  ? 'USING CAPGEN'
                  : 'IN THE STUDIO'
            }
            title={data.workflowTitle}
          />
          <ol className="list-decimal pl-5 space-y-5 text-slate-600 leading-relaxed">
            {data.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <SectionTitle
            eyebrow="RELATED GUIDES"
            title={
              path.startsWith('/platforms/')
                ? 'Caption styles and publishing guides'
                : path === '/contact'
                  ? 'Product help and policies'
                  : 'More about this workflow'
            }
          />
          <ul className="space-y-4">
            {data.related.map((route) => (
              <li key={route}>
                <Link
                  href={route}
                  className="font-semibold text-blue-600 underline underline-offset-4"
                >
                  {getRouteSeo(route)?.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-slate-600 leading-relaxed">
            New accounts start with five video credits. Review{' '}
            <Link href="/pricing" className="text-blue-600 underline">
              plans and upload limits
            </Link>{' '}
            before preparing a large file.
          </p>
        </div>
      </section>
      <section className="section">
        <SectionTitle
          eyebrow={data.eyebrow}
          title={
            path === '/contact'
              ? 'Contact and support questions'
              : path === '/about'
                ? 'What Capgen does'
                : `Questions about ${data.eyebrow.toLowerCase().replace(/^for /, '')}`
          }
        />
        <div className="faq">
          {data.faqs.map(([question, answer]) => (
            <details className="faq-row" key={question}>
              <summary className="cursor-pointer font-semibold text-slate-900">{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="cta-band">
        <h2>Caption your next video.</h2>
        <Button href="/editor">Start with the studio</Button>
      </section>
    </Shell>
  );
}
