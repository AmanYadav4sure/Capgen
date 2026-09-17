---
name: superseo
description: Comprehensive Super SEO & Digital Marketing Optimization Engine. Performs technical SEO audits, keyword research, backlink analysis, on-page content optimization, Schema markup generation, Core Web Vitals audit, programmatic SEO planning, and competitive intelligence.
---

# SuperSEO — Comprehensive SEO & Growth Engine

`superseo` is an elite, full-stack search engine optimization (SEO) and digital growth agentic skill. It combines technical SEO analysis, semantic keyword research, CTR-optimized metadata generation, structured data (JSON-LD), programmatic SEO architecture, and competitor backlink intelligence.

---

## Available Tools & Integrations

SuperSEO leverages the following SEO MCP tools when available:
- `keyword_generator`: Generates high-intent keyword ideas, long-tail variations, and search questions.
- `keyword_difficulty`: Analyzes keyword search volume, ranking difficulty, SERP competitiveness, and CPC metrics.
- `get_traffic`: Fetches domain organic traffic estimates, top ranking keywords, and traffic distribution.
- `get_backlinks_list`: Fetches backlink profile, referring domains, anchor text distribution, and link authority.
- `search_web`: Researches current live Google SERP results, competitor titles/meta, and featured snippet structures.

---

## Core SEO Workflows

### 1. Keyword Research & Intent Strategy (`superseo keywords`)
When requested to perform keyword research or target a niche:
1. **Discover Seed Keywords**: Call `keyword_generator` with seed topics to extract related search queries.
2. **Evaluate Opportunity**: Call `keyword_difficulty` to filter keywords with high volume and low-to-medium difficulty score (<40/100).
3. **Intent Mapping**:
   - **Informational**: How-to guides, articles, tutorials (Target: Long-form blogs, FAQs).
   - **Transactional / Commercial**: Product pages, pricing, comparison tables (Target: Landing pages, conversion funnels).
   - **Navigational**: Brand searches, direct login/app pages.
4. **Keyword Matrix Output**: Format a structured table containing Primary Keyword, Search Volume, Difficulty, Intent, and Target Page.

---

### 2. On-Page & Content Optimization (`superseo onpage`)
When optimizing existing pages or writing new copy:
- **Title Tags**:
  - Keep between **50 – 60 characters** (580px max).
  - Front-load primary keyword, include brand name at the end (e.g. `Primary Keyword - Value Proposition | Brand`).
  - CTR Power Words: "Free", "2026", "Best", "Fast", "Generator", "Online".
- **Meta Descriptions**:
  - Keep between **145 – 160 characters**.
  - Include secondary keywords and a clear Call-To-Action (CTA).
- **Heading Hierarchy (H1-H4)**:
  - Exactly **one H1** per page matching search intent.
  - Logical H2/H3 breakdown incorporating LSI keywords.
- **Content Formatting**:
  - Maintain 1-2% natural keyword density.
  - Short paragraphs (2-3 sentences max) for high mobile readability.
  - Include bullet lists, key takeaways, and visual media with descriptive `alt` tags.
- **Internal Linking**:
  - Contextual anchor text with relevant target keywords (avoid "click here").

---

### 3. Technical SEO & Schema Markup (`superseo technical`)
When performing technical site audits or schema implementation:
- **Canonical Tags**: Ensure `<link rel="canonical" href="https://domain.com/exact-path" />` is present.
- **Robots & Sitemap**:
  - `robots.txt`: Allow search engine bots, specify `Sitemap: https://domain.com/sitemap.xml`.
  - `sitemap.xml`: Auto-generate clean, updated URLs with `<lastmod>` timestamps.
- **Open Graph & Social Cards**:
  - `og:title`, `og:description`, `og:image` (1200x630px), `og:url`, `og:type`, `twitter:card`.
- **JSON-LD Structured Data**:
  Inject schema scripts into page `<head>` based on page type:
  ```html
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Capgen",
    "operatingSystem": "Web Browser",
    "applicationCategory": "MultimediaApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  </script>
  ```
  Supported Schema Types: `WebSite`, `Organization`, `SoftwareApplication`, `Article`, `FAQPage`, `BreadcrumbList`, `Product`.

---

### 4. Backlink & Competitor Intelligence (`superseo backlinks`)
When analyzing domain authority and off-page signals:
1. **Domain Profile Audit**: Call `get_traffic` for traffic estimates and `get_backlinks_list` to inspect referring domains.
2. **Link Quality Assessment**:
   - Check dofollow vs nofollow ratios.
   - Inspect anchor text diversity (brand, exact match, partial match, naked URL).
3. **Competitor Content Gap**: Identify topics competitor domains rank for that your site is missing.
4. **Outreach & Link Building**: Formulate high-converting outreach email templates for guest posts, broken link building, and resource page inclusion.

---

### 5. Next.js App Router Programmatic SEO (`superseo nextjs`)
For Next.js App Router projects:
- Export structured `Metadata` or `generateMetadata()`:
  ```typescript
  import type { Metadata } from 'next';

  export async function generateMetadata(): Promise<Metadata> {
    return {
      title: 'Free AI Subtitle & Caption Generator | Capgen',
      description: 'Auto-generate animated subtitles & viral captions for reels, shorts, and TikTok in seconds with AI.',
      alternates: {
        canonical: 'https://capgen.com',
      },
      openGraph: {
        title: 'Free AI Subtitle Generator',
        description: 'Create viral captions with 100+ styles instantly.',
        url: 'https://capgen.com',
        siteName: 'Capgen',
        images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      },
    };
  }
  ```

---

## SuperSEO Output Checklist

When executing an SEO audit or strategy document for the user:
- [ ] Primary & Secondary Keyword Strategy
- [ ] Title Tag & Meta Description Recommendations
- [ ] Heading Outline (H1, H2, H3)
- [ ] JSON-LD Schema Snippets
- [ ] Technical Fixes (Canonicals, Open Graph, Sitemap, Robots)
- [ ] Backlink & Outreach Plan (if applicable)
