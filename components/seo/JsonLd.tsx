/**
 * Structured data (schema.org JSON-LD) — improves rich-result eligibility.
 * Each component renders an inline <script type="application/ld+json">.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aetechdigitalhub.com';

function jsonLdScript(data: object) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organisation — render once globally (in root layout) */
export function OrgJsonLd() {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'aeTech Digital Hub',
    alternateName: 'aeTech',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/aetech-logo.png`,
      width: 512,
      height: 512,
    },
    image: `${SITE_URL}/aetech-logo.png`,
    description:
      'A specialist engineering and design studio in Accra, Ghana. We build bespoke websites, SaaS platforms, data systems, and security audits for serious teams.',
    foundingDate: '2024',
    founders: [{ '@type': 'Person', name: 'Ephraim' }],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Spintex Flower Port',
      addressLocality: 'Accra',
      addressRegion: 'Greater Accra',
      addressCountry: 'GH',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+233-55-444-8061',
        contactType: 'customer support',
        email: 'ephraim@aetechdigitalhub.com',
        areaServed: ['GH', 'NG', 'US', 'GB'],
        availableLanguage: ['English'],
      },
    ],
    sameAs: [],
    slogan: 'You dream, we build.',
  });
}

/** WebSite + SearchAction — site-wide search box in Google results */
export function WebsiteJsonLd() {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'aeTech Digital Hub',
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-US',
  });
}

/** Service — for each service detail page */
export function ServiceJsonLd({
  name,
  description,
  slug,
  startingFromUsd,
}: {
  name: string;
  description: string;
  slug: string;
  startingFromUsd?: number;
}) {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/services/${slug}#service`,
    name,
    description,
    provider: { '@id': `${SITE_URL}/#organization` },
    serviceType: name,
    areaServed: { '@type': 'Country', name: ['Ghana', 'United States', 'United Kingdom'] },
    url: `${SITE_URL}/services/${slug}`,
    ...(startingFromUsd
      ? {
          offers: {
            '@type': 'Offer',
            price: startingFromUsd,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
            description: `Starting from USD ${startingFromUsd}`,
          },
        }
      : {}),
  });
}

/** Article — for research / blog posts */
export function ArticleJsonLd({
  title,
  description,
  slug,
  publishedAt,
  author,
  image,
}: {
  title: string;
  description: string;
  slug: string;
  publishedAt?: string | Date;
  author?: string;
  image?: string;
}) {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? [image] : [`${SITE_URL}/og-default.png`],
    datePublished: publishedAt ? new Date(publishedAt).toISOString() : undefined,
    dateModified: publishedAt ? new Date(publishedAt).toISOString() : undefined,
    author: { '@type': 'Organization', name: author || 'aeTech Digital Hub' },
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/research/${slug}` },
  });
}

/** Project / Case study — Creative Work */
export function CaseStudyJsonLd({
  title,
  description,
  slug,
  client,
  year,
  image,
}: {
  title: string;
  description: string;
  slug: string;
  client?: string;
  year?: number;
  image?: string;
}) {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    description,
    image: image ? [image] : [`${SITE_URL}/og-default.png`],
    datePublished: year ? `${year}-01-01` : undefined,
    creator: { '@id': `${SITE_URL}/#organization` },
    about: client,
    url: `${SITE_URL}/projects/${slug}`,
  });
}

/** Breadcrumbs */
export function BreadcrumbJsonLd({ trail }: { trail: { name: string; href: string }[] }) {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: `${SITE_URL}${b.href}`,
    })),
  });
}

/** FAQ — for FAQ-style sections */
export function FaqJsonLd({ items }: { items: { q: string; a: string }[] }) {
  return jsonLdScript({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  });
}
