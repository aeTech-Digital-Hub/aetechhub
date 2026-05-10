export type ServiceTier = {
  /** Tier label — Basic / Standard / Enterprise */
  name: "Basic" | "Standard" | "Enterprise";
  /** Marketing tagline for the tier — "What this is for" */
  tagline: string;
  /** Starting price in USD. null means "Custom" (quoted on request) */
  priceUsd: number | null;
  /** Optional duration estimate */
  duration?: string;
  /** Bullet list of what's included */
  includes: string[];
  /** What's notably NOT in this tier — useful as honest disclosure */
  excludes?: string[];
  /** Visible disclaimer about pricing for this tier */
  priceNote?: string;
  /** A one-line "ideal for" hint shown under the tagline */
  idealFor?: string;
  /** Mark as the recommended/most-popular tier */
  highlighted?: boolean;
};

export type Service = {
  slug: string;
  name: string;
  short: string;
  description: string;
  category: "build" | "data" | "security";
  whatYouGet: string[];
  idealFor: string[];
  startingFromUsd?: number;
  photo?: string;
  /** Three tiers — Basic / Standard / Enterprise */
  tiers?: ServiceTier[];
};

export const SERVICES: Service[] = [
  {
    slug: "web-product",
    name: "Web & Product Engineering",
    short: "Bespoke websites and digital products built from first principles.",
    description:
      "Full-stack websites, marketplaces, and product surfaces built with modern frameworks and editorial design sensibility. No themes, no page-builders.",
    category: "build",
    whatYouGet: [
      "Custom design system tailored to your brand",
      "Production-grade Next.js or React codebase",
      "Headless CMS or admin dashboard",
      "CI/CD, monitoring, and 30-day post-launch support",
    ],
    idealFor: [
      "Founders launching v1",
      "Brands replacing template sites",
      "Companies refactoring legacy stacks",
    ],
    startingFromUsd: 1200,
    photo:
      "https://images.unsplash.com/photo-1547658719-da2b51169166?w=1600&q=80&auto=format&fit=crop",
    tiers: [
      {
        name: "Basic",
        tagline: "A polished marketing site, shipped fast.",
        priceUsd: 1200,
        duration: "3–4 weeks",
        idealFor:
          "Founders launching v1 or small teams replacing a templated site.",
        includes: [
          "Up to 6 pages designed and built",
          "Custom design tailored to your brand",
          "Production Next.js codebase",
          "Headless CMS (Sanity or Contentful) for editing",
          "Mobile-first, accessible, fast",
          "SEO basics — sitemap, OG tags, schema",
          "30 days of post-launch support",
        ],
        excludes: [
          "Custom integrations or back-end work",
          "Advanced animations or interactive prototypes",
        ],
      },
      {
        name: "Standard",
        tagline: "A site that is also a product.",
        priceUsd: 3500,
        duration: "6–10 weeks",
        idealFor:
          "Brands that need a marketing site plus a couple of dynamic surfaces.",
        highlighted: true,
        includes: [
          "Everything in Basic",
          "Up to 15 pages with custom interactive sections",
          "Custom design system with documented tokens",
          "CMS schema designed for your editorial workflow",
          "Newsletter, lead capture, or contact-form integrations",
          "Performance budget enforced (Core Web Vitals green)",
          "Animation and motion design built in",
          "60 days of post-launch support",
        ],
      },
      {
        name: "Enterprise",
        tagline: "Full website program with a retainer behind it.",
        priceUsd: null,
        duration: "Multi-quarter, phased",
        idealFor:
          "Companies with multi-region content, multiple stakeholders, or ongoing campaign needs.",
        includes: [
          "Everything in Standard",
          "Multi-locale and translation workflows",
          "A/B testing infrastructure built in",
          "Editor training and on-call CMS support",
          "Quarterly design + performance reviews",
          "Dedicated retainer hours for ongoing iteration",
          "Migration off your existing platform if needed",
          "SLA-backed uptime monitoring",
        ],
        priceNote:
          "Quoted after a discovery call. Typical engagements start at $15,000.",
      },
    ],
  },
  {
    slug: "saas",
    name: "SaaS Platform Development",
    short: "End-to-end SaaS — from architecture to billing.",
    description:
      "Multi-tenant SaaS products with auth, billing, role-based access, admin tooling, and the operational plumbing that turns an idea into a live business.",
    category: "build",
    whatYouGet: [
      "Multi-tenant architecture with row-level isolation",
      "Stripe / Paystack billing integration",
      "Admin + customer dashboards",
      "Background jobs, email, webhooks",
    ],
    idealFor: [
      "B2B founders",
      "Spinning out an internal tool",
      "Migrating off no-code",
    ],
    startingFromUsd: 4500,
    photo:
      "https://images.unsplash.com/photo-1633988354540-d3f4e97c67b5?w=1600&q=80&auto=format&fit=crop",
    tiers: [
      {
        name: "Basic",
        tagline: "A working MVP, in your customers' hands.",
        priceUsd: 4500,
        duration: "6–10 weeks",
        idealFor:
          "Founders validating an idea who need a real product, not a clickable mockup.",
        includes: [
          "Multi-tenant architecture with row-level isolation",
          "Authentication (email + Google OAuth)",
          "Stripe or Paystack subscriptions",
          "One core feature flow built end-to-end",
          "Customer dashboard + minimal admin panel",
          "Webhooks and transactional email",
          "Deployed on Vercel / Render / Fly with monitoring",
          "30 days of post-launch support",
        ],
        excludes: [
          "Complex permission models",
          "Multiple billing plans or add-ons",
          "Audit logs or SOC2 hardening",
        ],
      },
      {
        name: "Standard",
        tagline: "A SaaS your sales team can confidently sell.",
        priceUsd: 12000,
        duration: "3–5 months",
        idealFor:
          "Founders past validation, raising or hiring against a product that needs depth.",
        highlighted: true,
        includes: [
          "Everything in Basic",
          "Role-based access control (RBAC)",
          "Multiple billing plans, usage metering, trials",
          "Onboarding and account management flows",
          "Full admin tooling (impersonation, support tools, audit logs)",
          "Background jobs and scheduled tasks",
          "API + webhooks for customer integrations",
          "Email/SMS notifications",
          "60 days of post-launch support",
        ],
      },
      {
        name: "Enterprise",
        tagline: "A platform with the team to maintain it.",
        priceUsd: null,
        duration: "Multi-phase, ongoing",
        idealFor:
          "Series-A teams, regulated industries, or platforms expecting >10k users in the first year.",
        includes: [
          "Everything in Standard",
          "SOC2 / HIPAA preparedness (audit-ready architecture)",
          "Single sign-on (SAML / OIDC)",
          "Multi-region deployment and DR planning",
          "Dedicated mobile app (iOS / Android) if needed",
          "Embedded analytics for customer insights",
          "On-call retainer + monthly engineering hours",
          "Quarterly architecture reviews",
        ],
        priceNote:
          "Quoted after a discovery call. Typical engagements start at $40,000 plus retainer.",
      },
    ],
  },
  {
    slug: "data-analysis",
    name: "Data Analysis & BI",
    short: "Turn your data into decisions.",
    description:
      "We ingest, model, and visualise your business data — Shopify, Stripe, CRM, ad platforms — so leadership has a single pane of glass for revenue, retention, and acquisition.",
    category: "data",
    whatYouGet: [
      "ETL pipelines (Airbyte / custom)",
      "Warehouse setup (BigQuery / Postgres)",
      "Custom dashboards (Metabase / bespoke)",
      "Weekly insight reports",
    ],
    idealFor: [
      "Ops leads tired of spreadsheets",
      "Boards asking for clean numbers",
      "Marketing teams sizing CAC/LTV",
    ],
    startingFromUsd: 1500,
    photo:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80&auto=format&fit=crop",
    tiers: [
      {
        name: "Basic",
        tagline: "Get a clear picture of your business.",
        priceUsd: 1500,
        duration: "3–4 weeks",
        idealFor:
          "Founders who want clean weekly numbers without hiring an analyst.",
        includes: [
          "Connect up to 4 data sources (Stripe, Shopify, ad platforms, CRM)",
          "Hosted Postgres or BigQuery warehouse setup",
          "One unified dashboard (Metabase or Lightdash)",
          "Pre-built reports for revenue, retention, customers",
          "Weekly automated insight email to your inbox",
          "30 days of support and dashboard refinement",
        ],
        excludes: [
          "Custom data modelling beyond standard sources",
          "Real-time streaming pipelines",
          "Predictive or ML-powered analysis",
        ],
      },
      {
        name: "Standard",
        tagline: "A real BI function, without the headcount.",
        priceUsd: 4000,
        duration: "8–12 weeks",
        idealFor: "Operators making decisions on $1M+ in flowing revenue.",
        highlighted: true,
        includes: [
          "Everything in Basic",
          "Up to 10 data sources with custom modelling",
          "dbt-based semantic layer (your single source of truth)",
          "Multi-team dashboards (sales, marketing, product, finance)",
          "CAC / LTV / cohort analysis baked in",
          "Custom alerting (Slack/email) for KPI thresholds",
          "Monthly review sessions for the first quarter",
          "60 days of support",
        ],
      },
      {
        name: "Enterprise",
        tagline: "Data infrastructure for a serious business.",
        priceUsd: null,
        duration: "Multi-quarter, phased",
        idealFor:
          "Companies running on data — fintech, marketplaces, multi-product platforms.",
        includes: [
          "Everything in Standard",
          "Real-time streaming pipelines (Kafka, Debezium)",
          "Reverse ETL into operational tools (Hubspot, Salesforce)",
          "Custom embedded analytics for your customers",
          "Predictive forecasting and ML-powered cohort analysis",
          "Data governance, lineage, and compliance documentation",
          "Dedicated retainer for ongoing modelling",
          "Quarterly business reviews",
        ],
        priceNote:
          "Quoted after a discovery call. Typical engagements start at $20,000 plus retainer.",
      },
    ],
  },
  {
    slug: "machine-learning",
    name: "Machine Learning & AI",
    short: "Models that ship — not science projects.",
    description:
      "From recommendation engines to LLM-powered workflows. We focus on production ML: monitoring, drift detection, and clean APIs your engineers can integrate.",
    category: "data",
    whatYouGet: [
      "Discovery + feasibility study",
      "Model training and evaluation",
      "Production API + monitoring",
      "LLM workflows (RAG, agents, fine-tuning)",
    ],
    idealFor: [
      "Teams with data, no ML talent",
      "Adding AI to existing products",
      "Custom GPT-style assistants",
    ],
    startingFromUsd: 2800,
    photo:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1600&q=80&auto=format&fit=crop",
    tiers: [
      {
        name: "Basic",
        tagline: "A working ML feature, integrated.",
        priceUsd: 2800,
        duration: "4–6 weeks",
        idealFor:
          "Teams adding their first AI feature — recommendations, classification, or LLM-powered text.",
        includes: [
          "Discovery call + feasibility memo",
          "One model trained, evaluated, and deployed",
          "Production API your engineers can call",
          "Basic monitoring (latency, errors, model drift)",
          "Documentation and a handover session",
          "30 days of post-launch support",
        ],
        excludes: [
          "Custom data labelling at scale",
          "Multiple model variants or A/B infrastructure",
          "Fine-tuned LLMs or RAG systems",
        ],
      },
      {
        name: "Standard",
        tagline: "A real ML system in your stack.",
        priceUsd: 8000,
        duration: "8–14 weeks",
        idealFor:
          "Companies where AI is now a competitive feature, not a side project.",
        highlighted: true,
        includes: [
          "Everything in Basic",
          "Custom RAG system with your knowledge base",
          "LLM workflows — assistants, agents, or generation",
          "Fine-tuning of a small open model if appropriate",
          "A/B infrastructure for safe rollout",
          "Drift detection and retraining schedule",
          "Cost-monitoring dashboard",
          "Eval suite to catch regressions",
          "60 days of support",
        ],
      },
      {
        name: "Enterprise",
        tagline: "AI as a platform capability.",
        priceUsd: null,
        duration: "Multi-phase, ongoing",
        idealFor:
          "Companies with multiple AI features, regulatory exposure, or proprietary data moats.",
        includes: [
          "Everything in Standard",
          "Self-hosted / VPC-deployed LLM inference",
          "Custom data labelling pipeline with your team",
          "Multiple production models with shared infrastructure",
          "Compliance documentation (model cards, audit logs)",
          "Internal ML platform tooling for your engineers",
          "Dedicated retainer + ongoing research time",
          "Quarterly model reviews",
        ],
        priceNote:
          "Quoted after a discovery call. Typical engagements start at $30,000 plus retainer.",
      },
    ],
  },
  {
    slug: "security-analysis",
    name: "Security Analysis",
    short: "Find what attackers will find — first.",
    description:
      "Architecture reviews, threat models, and code-level audits for fintech, health, and SaaS products. Output is a prioritised remediation plan, not a 60-page PDF.",
    category: "security",
    whatYouGet: [
      "Architecture & threat model review",
      "Code audit on critical paths",
      "OWASP Top 10 verification",
      "Prioritised remediation roadmap",
    ],
    idealFor: [
      "Pre-Series A diligence",
      "Compliance prep",
      "Post-incident hardening",
    ],
    startingFromUsd: 1800,
    photo:
      "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1600&q=80&auto=format&fit=crop",
    tiers: [
      {
        name: "Basic",
        tagline: "A focused review of one application.",
        priceUsd: 1800,
        duration: "2 weeks",
        idealFor:
          "Pre-launch hardening or a one-off concern about a specific application.",
        includes: [
          "Architecture review session with your team",
          "Threat model for one application",
          "OWASP Top 10 verification on critical endpoints",
          "Code audit of authentication and payment paths",
          "Prioritised remediation report (Critical / High / Medium)",
          "Verification call after fixes are applied",
        ],
        excludes: [
          "Active exploitation testing (see Penetration Testing)",
          "Cloud infrastructure review",
          "Compliance documentation",
        ],
      },
      {
        name: "Standard",
        tagline: "A full security posture review.",
        priceUsd: 5000,
        duration: "4–6 weeks",
        idealFor:
          "Pre-Series A diligence, post-incident review, or compliance prep (SOC2 readiness).",
        highlighted: true,
        includes: [
          "Everything in Basic",
          "Full code audit across the codebase, not just hot paths",
          "Cloud / infrastructure review (AWS, GCP, or Azure)",
          "Identity and access management audit",
          "Data flow mapping and PII inventory",
          "Incident response playbook draft",
          "Compliance gap analysis (SOC2 / GDPR / HIPAA, your choice)",
          "Two follow-up calls during remediation",
        ],
      },
      {
        name: "Enterprise",
        tagline: "Security as an ongoing function.",
        priceUsd: null,
        duration: "Multi-quarter, retainer",
        idealFor:
          "Fintech, health, and regulated industries with continuous security needs.",
        includes: [
          "Everything in Standard",
          "Quarterly security reviews on a recurring schedule",
          "Dedicated CISO-as-a-service hours",
          "Compliance documentation written for auditors",
          "Vendor and third-party risk assessment",
          "Security training sessions for your engineering team",
          "On-call incident response retainer",
          "Annual penetration test included",
        ],
        priceNote:
          "Quoted after a discovery call. Typical engagements start at $20,000 plus retainer.",
      },
    ],
  },
  {
    slug: "penetration-testing",
    name: "Penetration Testing",
    short: "Adversarial testing on your live systems.",
    description:
      "Black-box and grey-box pen tests on web apps, APIs, and cloud infrastructure. Aligned with PTES, NIST, and OWASP methodologies. Includes a full re-test after fixes.",
    category: "security",
    whatYouGet: [
      "Scoping + rules of engagement",
      "Manual exploitation by senior testers",
      "CVSS-scored findings report",
      "Free re-test within 30 days",
    ],
    idealFor: [
      "Annual compliance",
      "Pre-launch hardening",
      "After major refactors",
    ],
    startingFromUsd: 2400,
    photo:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&q=80&auto=format&fit=crop",
    tiers: [
      {
        name: "Basic",
        tagline: "One pen test, one application.",
        priceUsd: 2400,
        duration: "2 weeks",
        idealFor:
          "Annual compliance, a one-time check before launch, or after a major refactor.",
        includes: [
          "Scoping call and rules of engagement document",
          "Black-box external testing on one web application or API",
          "Manual exploitation by senior testers (no scanner spam)",
          "CVSS-scored findings with proof-of-concept",
          "Executive summary plus technical detail report",
          "Free re-test within 30 days",
        ],
        excludes: [
          "Mobile application testing",
          "Cloud configuration review",
          "Social engineering or red-team exercises",
        ],
      },
      {
        name: "Standard",
        tagline: "A thorough adversarial assessment.",
        priceUsd: 6500,
        duration: "3–4 weeks",
        idealFor:
          "Pre-Series A diligence, fintech compliance, or systems with significant attack surface.",
        highlighted: true,
        includes: [
          "Everything in Basic",
          "Grey-box testing with credentialed user roles",
          "Mobile application testing if applicable (iOS + Android)",
          "Cloud / infrastructure configuration review",
          "API authentication and authorisation deep-dive",
          "Business logic abuse testing",
          "Two re-tests within 60 days",
          "Briefing call with your engineering leadership",
        ],
      },
      {
        name: "Enterprise",
        tagline: "Continuous adversarial pressure.",
        priceUsd: null,
        duration: "Quarterly, retainer",
        idealFor:
          "Mature SaaS, fintech, and platforms where security is regulatory.",
        includes: [
          "Everything in Standard",
          "Quarterly penetration tests on a rotating schedule",
          "Red-team exercises — including social engineering if scoped",
          "Bug bounty programme triage and management",
          "Continuous attack-surface monitoring",
          "Detailed compliance reports for auditors",
          "On-call incident response",
          "Annual external CISO-as-a-service review",
        ],
        priceNote:
          "Quoted after a discovery call. Typical engagements start at $25,000 per quarter.",
      },
    ],
  },
];

export const PROJECT_TYPES = [
  { id: "web-product", label: "Marketing site or product website" },
  { id: "saas", label: "SaaS / multi-tenant platform" },
  { id: "ecommerce", label: "E-commerce or marketplace" },
  { id: "mobile", label: "Mobile app (iOS / Android)" },
  { id: "data", label: "Data analysis / BI dashboard" },
  { id: "ml", label: "Machine learning / AI integration" },
  { id: "security", label: "Security audit / pen test" },
  { id: "unsure", label: "I'm not sure yet — help me decide" },
];

export const BUDGET_RANGES = [
  "Under $1,500",
  "$1,500 – $3,500",
  "$3,500 – $7,000",
  "$7,000 – $15,000",
  "$15,000+",
  "Not sure yet",
];

export const TIMELINES = [
  "ASAP (< 1 month)",
  "1–3 months",
  "3–6 months",
  "6+ months",
  "Flexible",
];
