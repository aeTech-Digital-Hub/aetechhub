/**
 * JSON-LD structured data helpers.
 *
 * Emit three blocks in the root layout to give Google unambiguous signals
 * about who and where we are:
 *
 * 1. Organization — the entity behind the site
 * 2. LocalBusiness — a physical Accra location that can show up in Google Maps / local pack
 * 3. WebSite — enables sitelink search box + potentialAction
 *
 * Each block is rendered as a <script type="application/ld+json"> element.
 * We use dangerouslySetInnerHTML because Next.js sanitises JSON in
 * <script> attributes, which breaks structured data validation.
 */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://aetechorg.com';

// Studio contact facts — single source of truth
const STUDIO = {
  name: 'aeTech Digital Hub',
  legalName: 'aeTech Digital Hub',
  url: SITE_URL,
  logo: `${SITE_URL}/aetech-logo.png`,
  ogImage: `${SITE_URL}/og-default.png`,
  email: 'ephraim@aetechdigitalhub.com',
  telephone: '+233554448061',
  street: 'Spintex Flower Port',
  city: 'Accra',
  region: 'Greater Accra',
  postalCode: '00233',
  country: 'GH',
  countryFull: 'Ghana',
  latitude: 5.6212,   // Approximate Spintex area
  longitude: -0.1234, // Adjust to your exact location
  founder: 'Ephraim Tetteh Apetorgbor',
  foundingDate: '2023',
  // Add profile URLs here as you create them — Google uses `sameAs` to
  // disambiguate your entity from others with similar names.
  sameAs: [
    // 'https://www.linkedin.com/company/aetech-digital-hub',
    // 'https://twitter.com/aetechdigitalhub',
    // 'https://github.com/aetechdigitalhub',
  ],
};

function ldScript(data: object) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ─── 1. Organization ──────────────────────────────────
export function OrgJsonLd() {
  return ldScript({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: STUDIO.name,
    legalName: STUDIO.legalName,
    url: STUDIO.url,
    logo: {
      '@type': 'ImageObject',
      url: STUDIO.logo,
      width: 512,
      height: 512,
    },
    image: STUDIO.ogImage,
    email: STUDIO.email,
    telephone: STUDIO.telephone,
    founder: {
      '@type': 'Person',
      name: STUDIO.founder,
    },
    foundingDate: STUDIO.foundingDate,
    address: {
      '@type': 'PostalAddress',
      streetAddress: STUDIO.street,
      addressLocality: STUDIO.city,
      addressRegion: STUDIO.region,
      addressCountry: STUDIO.country,
    },
    areaServed: [
      { '@type': 'Country', name: 'Ghana' },
      { '@type': 'Country', name: 'United Kingdom' },
      { '@type': 'Country', name: 'United States' },
    ],
    knowsAbout: [
      'Web development',
      'SaaS platforms',
      'Machine learning',
      'Cybersecurity',
      'Penetration testing',
      'Data analysis',
      'Cloud infrastructure',
      'Next.js',
      'AWS',
    ],
    sameAs: STUDIO.sameAs,
  });
}

// ─── 2. LocalBusiness ─────────────────────────────────
/**
 * LocalBusiness is what makes you eligible for Google's local pack + Google Maps.
 * Note: LocalBusiness IS-A Organization, so we give it its own @id and Google can
 * cross-reference the two.
 */
export function LocalBusinessJsonLd() {
  return ldScript({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE_URL}/#localbusiness`,
    name: STUDIO.name,
    image: STUDIO.ogImage,
    url: STUDIO.url,
    telephone: STUDIO.telephone,
    email: STUDIO.email,
    priceRange: '$$$', // Standard convention for professional services
    address: {
      '@type': 'PostalAddress',
      streetAddress: STUDIO.street,
      addressLocality: STUDIO.city,
      addressRegion: STUDIO.region,
      addressCountry: STUDIO.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: STUDIO.latitude,
      longitude: STUDIO.longitude,
    },
    areaServed: [
      { '@type': 'Country', name: 'Ghana' },
      { '@type': 'Country', name: 'United Kingdom' },
      { '@type': 'Country', name: 'United States' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Engineering Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Custom Web & Product Development' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'SaaS Platform Development' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Data Analysis' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Machine Learning Engineering' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Security Analysis' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Penetration Testing' },
        },
      ],
    },
  });
}

// ─── 3. WebSite (enables sitelinks search box) ────────
export function WebSiteJsonLd() {
  return ldScript({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: STUDIO.name,
    description: 'Engineering studio in Accra, Ghana',
    publisher: {
      '@id': `${SITE_URL}/#organization`,
    },
    // If you build a search page at /search?q=..., uncomment this block to
    // opt into Google's sitelinks search box.
    // potentialAction: {
    //   '@type': 'SearchAction',
    //   target: {
    //     '@type': 'EntryPoint',
    //     urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    //   },
    //   'query-input': 'required name=search_term_string',
    // },
    inLanguage: 'en',
  });
}

// ─── Optional: Service-level JSON-LD ──────────────────
/**
 * Drop this into each of your six /services/[slug]/page.tsx routes to
 * make each service its own indexable entity. Example usage in a service page:
 *
 *   import { ServiceJsonLd } from '@/components/seo/JsonLd';
 *   // ...
 *   return (
 *     <>
 *       <ServiceJsonLd service={{ name: 'Penetration Testing', ... }} />
 *       ...
 *     </>
 *   );
 */
export function ServiceJsonLd({
  service,
}: {
  service: {
    name: string;
    description: string;
    slug: string;
    // Optional — helps for services with real pricing surfaced publicly
    priceRange?: string;
  };
}) {
  return ldScript({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@id': `${SITE_URL}/#organization`,
    },
    areaServed: [
      { '@type': 'Country', name: 'Ghana' },
      { '@type': 'Country', name: 'United Kingdom' },
      { '@type': 'Country', name: 'United States' },
    ],
    url: `${SITE_URL}/services/${service.slug}`,
    ...(service.priceRange && { priceRange: service.priceRange }),
  });
}

// ─── Optional: BreadcrumbList ─────────────────────────
/**
 * Adds a BreadcrumbList to any nested page for cleaner search result rendering.
 * Usage:
 *   <BreadcrumbJsonLd items={[
 *     { name: 'Services', href: '/services' },
 *     { name: 'Penetration Testing', href: '/services/penetration-testing' },
 *   ]} />
 */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; href: string }[];
}) {
  return ldScript({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  });
}



function jsonLdScript(data: object) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
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
