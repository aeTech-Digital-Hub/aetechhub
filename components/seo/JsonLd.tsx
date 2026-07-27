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
  process.env.NEXT_PUBLIC_SITE_URL || 'https://aetechdigitalhub.com';

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
// ─── PATCH FOR components/seo/JsonLd.tsx ─────────────────────────────
//
// Find the `ServiceJsonLd` function and replace it with the version below.
// It now accepts EITHER the flat form (name/description/slug/startingFromUsd)
// or the nested form (service={{...}}), so all existing callers keep working
// and the nested API remains available for new code.
//
// This is the only change needed. The rest of JsonLd.tsx stays as I sent it.

// ─── Optional: Service-level JSON-LD ──────────────────
/**
 * Drop this into each of your six /services/[slug]/page.tsx routes to
 * make each service its own indexable entity.
 *
 * Both signatures are accepted for backward compatibility:
 *
 * Flat (legacy — still supported):
 *   <ServiceJsonLd
 *     name={s.name}
 *     description={s.description}
 *     slug={s.slug}
 *     startingFromUsd={s.startingFromUsd}
 *   />
 *
 * Nested:
 *   <ServiceJsonLd service={{ name, description, slug, priceRange: '$$$' }} />
 */
export function ServiceJsonLd(props: {
  // Nested form
  service?: {
    name: string;
    description: string;
    slug: string;
    priceRange?: string;
  };
  // Flat form (legacy)
  name?: string;
  description?: string;
  slug?: string;
  priceRange?: string;
  startingFromUsd?: number | null;
}) {
  // Resolve either signature to a normalised shape
  const name = props.service?.name ?? props.name;
  const description = props.service?.description ?? props.description;
  const slug = props.service?.slug ?? props.slug;

  // priceRange precedence: explicit prop > derived from startingFromUsd > undefined
  let priceRange = props.service?.priceRange ?? props.priceRange;
  if (!priceRange && typeof props.startingFromUsd === 'number') {
    // Rough Schema.org-friendly bands based on your services page
    if (props.startingFromUsd >= 5000) priceRange = '$$$$';
    else if (props.startingFromUsd >= 1500) priceRange = '$$$';
    else if (props.startingFromUsd >= 500) priceRange = '$$';
    else priceRange = '$';
  }

  // If required fields are missing, render nothing rather than a broken schema
  if (!name || !description || !slug) return null;

  return ldScript({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@id': `${SITE_URL}/#organization`,
    },
    areaServed: [
      { '@type': 'Country', name: 'Ghana' },
      { '@type': 'Country', name: 'United Kingdom' },
      { '@type': 'Country', name: 'United States' },
    ],
    url: `${SITE_URL}/services/${slug}`,
    ...(priceRange && { priceRange }),
    ...(typeof props.startingFromUsd === 'number' && {
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: props.startingFromUsd,
        priceSpecification: {
          '@type': 'PriceSpecification',
          priceCurrency: 'USD',
          minPrice: props.startingFromUsd,
        },
        availability: 'https://schema.org/InStock',
      },
    }),
  });
}

// ─── Optional: BreadcrumbList ─────────────────────────
// ─── PATCH FOR components/seo/JsonLd.tsx ─────────────────────────────
//
// Find the `BreadcrumbJsonLd` function (near the bottom of the file)
// and replace it with the version below. It now accepts EITHER `items`
// or `trail` as the prop name, so existing callers using `trail` don't
// break, and new callers using `items` also work.
//
// This is the only change needed. The rest of JsonLd.tsx stays as I sent it.

// ─── Optional: BreadcrumbList ─────────────────────────
/**
 * Adds a BreadcrumbList to any nested page for cleaner search result rendering.
 *
 * Both `items` and `trail` are accepted for backward compatibility.
 *
 * Usage:
 *   <BreadcrumbJsonLd items={[
 *     { name: 'Services', href: '/services' },
 *     { name: 'Penetration Testing', href: '/services/penetration-testing' },
 *   ]} />
 *
 * Or (legacy signature — still works):
 *   <BreadcrumbJsonLd trail={[...]} />
 */
export function BreadcrumbJsonLd({
  items,
  trail,
}: {
  items?: { name: string; href: string }[];
  trail?: { name: string; href: string }[];
}) {
  const list = items ?? trail ?? [];
  return ldScript({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list.map((item, i) => ({
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
