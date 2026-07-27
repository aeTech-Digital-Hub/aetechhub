import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

export const metadata = {
  title: "Privacy notice",
  description:
    "How aeTech Digital Hub collects, uses, and protects personal information — plain-language version.",
  alternates: { canonical: "/privacy" },
};

// Update this when the policy meaningfully changes
const LAST_UPDATED = "27 July 2026";

export default function PrivacyPage() {
  return (
    <>
      {/* Header */}
      <section className="container-px pt-28 pb-8 lg:pt-36 lg:pb-10 bg-base">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              Back home
            </Link>
            <p className="eyebrow mb-5">Privacy notice</p>
            <h1 className="h-display text-[40px] sm:text-[48px] lg:text-[56px] tracking-tightest mb-4 leading-[1.02]">
              What we collect,{" "}
              <span className="italic font-light gradient-text">
                and what we don&apos;t.
              </span>
            </h1>
            <p className="text-[15px] lg:text-[16px] text-ink-2 leading-relaxed max-w-xl">
              A plain-language version of how we handle your information.
              Written the way we&apos;d want someone to write it to us.
            </p>
            <p className="text-[12px] font-mono text-ink-3 mt-6">
              Last updated: {LAST_UPDATED}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Body */}
      <section className="container-px pb-32 lg:pb-40 bg-base">
        <div className="max-w-3xl mx-auto">
          <div className="prose-brand">
            {/* Introduction */}
            <Section title="The short version">
              <p>
                aeTech Digital Hub (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a
                Ghanaian engineering studio based in Accra. This notice explains
                what information we collect when you use our website or work
                with us, why we collect it, who sees it, and how you can ask us
                to change or delete it.
              </p>
              <p>
                We collect as little as we reasonably can. We never sell your
                data. We don&apos;t use tracking cookies for ads. We hash your
                IP address before storing it. If you ever want your account or
                data deleted, one email does it.
              </p>
            </Section>

            {/* Data controller */}
            <Section title="Who's responsible for your data">
              <p>
                aeTech Digital Hub is the data controller for personal
                information you give us through this site. You can reach us at:
              </p>
              <ContactBlock />
            </Section>

            {/* What we collect */}
            <Section title="What we collect, and why">
              <p>
                Here&apos;s the complete list of what we collect and what we do
                with it.
              </p>

              <DataItem
                what="Newsletter subscriptions"
                data="Your email address, optional name, and a hashed record of the IP address you subscribed from."
                why="So we can send occasional dispatches about our work, and so we can respond to any abuse (spam signups, etc.)."
                keep="Until you unsubscribe. Every email has an unsubscribe link."
              />

              <DataItem
                what="Account sign-up"
                data="Your name, email address, hashed password (bcrypt), a hashed record of your sign-up IP, and a consent timestamp. If you sign in with Google, we also store your Google account ID and profile picture URL."
                why="So we can identify you when you sign back in, associate your work (briefs, invoices, projects) with your account, and give you access to your portal."
                keep="For as long as your account exists. You can request deletion anytime — see below."
              />

              <DataItem
                what="Project briefs"
                data="Everything you write into the brief editor — company name, industry, budget range, project goals, technical requirements, timelines, and anything else you enter voluntarily."
                why="So we can respond with a written scope and estimate. Without a brief, we can't quote work."
                keep="Draft briefs until you submit or delete. Submitted briefs kept alongside the engagement for our commercial records. Non-engaged briefs pruned after 12 months."
              />

              <DataItem
                what="Invoices and receipts"
                data="Client name, billing address, contact email, invoice line items, payment amounts, payment dates."
                why="For accounting, tax compliance, and issuing receipts. Ghanaian tax law requires we keep these records for six years."
                keep="Six years from the end of the tax year in which the invoice was issued, then deleted."
              />

              <DataItem
                what="Live chat messages"
                data="The content of messages you send us through the chat widget, your session ID, and (if you provided them) your name and email."
                why="So we can respond, and so we have context on prior conversations if you return."
                keep="Chat sessions are retained for 90 days, then deleted."
              />

              <DataItem
                what="Site usage (page views)"
                data="Which pages you visited, when, and a hashed record of your IP. We do NOT use Google Analytics or similar third-party trackers on this site."
                why="So we can understand which pages are useful and improve the site. This is our own lightweight analytics — no third-party ad networks are involved."
                keep="30 days, then aggregated and the individual records deleted."
              />

              <DataItem
                what="Admin action logs (staff-only)"
                data="Which staff member did what admin action, when, and against which record. Only applies to aeTech staff, not clients."
                why="So we can audit sensitive operations like sharing an invoice or accessing a client's data."
                keep="90 days, then automatically deleted."
              />
            </Section>

            {/* What we don't collect */}
            <Section title="What we don't do">
              <ul className="mt-4">
                <li>
                  We do <strong>not</strong> sell your data to anyone.
                </li>
                <li>
                  We do <strong>not</strong> use Google Analytics, Facebook
                  Pixel, or any advertising trackers on this site.
                </li>
                <li>
                  We do <strong>not</strong> store your IP address in raw form.
                  All IP addresses are hashed (SHA-256) at collection time so we
                  can identify abuse patterns without keeping the actual IP.
                </li>
                <li>
                  We do <strong>not</strong> use tracking cookies. The only
                  cookies we set are strictly necessary — session cookies for
                  authentication and a signed session ID for the chat widget.
                </li>
                <li>
                  We do <strong>not</strong> read the content of files or
                  projects we&apos;re building for you beyond what&apos;s needed
                  to build them.
                </li>
              </ul>
            </Section>

            {/* Third-party services */}
            <Section title="Third parties that see your data">
              <p>
                We use a small number of trusted services to run our business.
                Each is a data processor acting on our instructions.
              </p>
              <ul className="mt-4">
                <li>
                  <strong>MongoDB Atlas</strong> — where we store account,
                  brief, invoice, and chat data. Data hosted in an EU region.
                </li>
                <li>
                  <strong>Vercel</strong> — where this website is hosted. Vercel
                  processes request logs briefly and does not retain personal
                  data beyond what&apos;s needed to serve the site.
                </li>
                <li>
                  <strong>
                    Google (for &ldquo;Sign in with Google&rdquo;)
                  </strong>{" "}
                  — only used if you choose to sign in with Google. Google
                  shares your name, email, and profile picture with us; we
                  don&apos;t send them anything.
                </li>
                <li>
                  <strong>Email provider (SMTP)</strong> — we use SMTP to send
                  transactional emails (welcome messages, invoice links,
                  newsletter). Email content passes through our provider&apos;s
                  servers en route to you.
                </li>
                <li>
                  <strong>SMS provider (Termii)</strong> — used only if we need
                  to send you an SMS notification for a booking confirmation.
                  Never for marketing.
                </li>
              </ul>
              <p className="mt-4">
                We do <strong>not</strong> share your data with anyone outside
                these processors. In particular: no advertising networks, no
                data brokers, no analytics companies.
              </p>
            </Section>

            {/* Legal basis */}
            <Section title="On what basis we hold your data">
              <p>
                Depending on the data, we rely on one of the following bases
                from the Ghana Data Protection Act (Act 843) and equivalent
                provisions of GDPR / UK GDPR:
              </p>
              <ul className="mt-4">
                <li>
                  <strong>Consent</strong> — for newsletter sign-ups. You can
                  withdraw anytime by using the unsubscribe link in any email we
                  send.
                </li>
                <li>
                  <strong>Contract</strong> — for account, brief, invoice, and
                  project data. We need this data to provide the services
                  we&apos;ve agreed to.
                </li>
                <li>
                  <strong>Legitimate interest</strong> — for security logs,
                  audit logs, and hashed-IP analytics. We&apos;ve balanced this
                  against your interests and take steps (like hashing IPs) to
                  minimise the impact on your privacy.
                </li>
                <li>
                  <strong>Legal obligation</strong> — for invoice and tax
                  records we are required to retain under Ghanaian tax law.
                </li>
              </ul>
            </Section>

            {/* Your rights */}
            <Section title="Your rights">
              <p>
                Under Ghana&apos;s Data Protection Act (Act 843), GDPR, and UK
                GDPR, you have the right to:
              </p>
              <ul className="mt-4">
                <li>
                  <strong>Access</strong> a copy of the personal data we hold
                  about you
                </li>
                <li>
                  <strong>Correct</strong> data that&apos;s wrong or incomplete
                </li>
                <li>
                  <strong>Delete</strong> your data (with some exceptions where
                  we&apos;re legally required to keep it — like invoice records
                  for six years)
                </li>
                <li>
                  <strong>Restrict</strong> how we process your data
                </li>
                <li>
                  <strong>Object</strong> to processing based on legitimate
                  interest
                </li>
                <li>
                  <strong>Withdraw consent</strong> at any time
                </li>
                <li>
                  <strong>Complain</strong> to a supervisory authority —
                  Ghana&apos;s{" "}
                  <a
                    href="https://dataprotection.org.gh/"
                    className="link-brand"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Data Protection Commission
                  </a>{" "}
                  if you&apos;re in Ghana, your national data protection
                  authority if you&apos;re elsewhere.
                </li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, email{" "}
                <a
                  href="mailto:ephraim@aetechdigitalhub.com"
                  className="link-brand"
                >
                  ephraim@aetechdigitalhub.com
                </a>
                . We&apos;ll respond within 30 days.
              </p>
            </Section>

            {/* Data security */}
            <Section title="How we protect your data">
              <p>
                Passwords are hashed using bcrypt with a work factor of 12.
                Session tokens are signed with a private key and marked HttpOnly
                + Secure. IP addresses are hashed with SHA-256 before storage.
                Sensitive admin actions (like sharing an invoice) are logged for
                accountability.
              </p>
              <p className="mt-4">
                We build with security best practices from OWASP, NIST, and
                PTES. No system is perfectly secure — if we ever suspect a
                breach that affects your data, we&apos;ll notify you within 72
                hours and report to Ghana&apos;s Data Protection Commission as
                required by law.
              </p>
            </Section>

            {/* International transfers */}
            <Section title="If you're outside Ghana">
              <p>
                We serve clients in the UK and the US, so your data may be
                transferred to servers in the EU or US region of MongoDB Atlas
                and Vercel. We only work with providers who meet appropriate
                international transfer standards (Standard Contractual Clauses,
                EU-US Data Privacy Framework where applicable).
              </p>
            </Section>

            {/* Children */}
            <Section title="Children">
              <p>
                Our services are for businesses and adults. We do not knowingly
                collect information from children under 16. If you believe
                we&apos;ve collected data from a child, email us and we&apos;ll
                delete it.
              </p>
            </Section>

            {/* Changes */}
            <Section title="Changes to this notice">
              <p>
                We may update this notice occasionally. Meaningful changes will
                be announced via a banner on the site for at least 30 days. The
                &ldquo;Last updated&rdquo; date at the top of this page always
                reflects the latest revision.
              </p>
            </Section>

            {/* Contact */}
            <Section title="Contact">
              <p>Questions, requests, or complaints:</p>
              <ContactBlock />
            </Section>

            {/* Disclaimer */}
            <div className="mt-16 pt-8 border-t border-rule">
              <p className="text-[12px] text-ink-3 italic leading-relaxed">
                This notice is provided in plain language and reflects our
                actual practices. It is not legal advice. If you need a legal
                interpretation of your rights, please consult a qualified lawyer
                in your jurisdiction. For a formal complaint about our handling
                of data, contact the Ghana Data Protection Commission or your
                national supervisory authority.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─────────────────────────────────────────
// LOCAL COMPONENTS
// ─────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <section className="mt-14 first:mt-0">
        <h2 className="h-display text-[24px] lg:text-[28px] tracking-tighter mb-5">
          {title}
        </h2>
        <div className="text-[15px] lg:text-[16px] text-ink-2 leading-relaxed space-y-3">
          {children}
        </div>
      </section>
    </Reveal>
  );
}

function DataItem({
  what,
  data,
  why,
  keep,
}: {
  what: string;
  data: string;
  why: string;
  keep: string;
}) {
  return (
    <div className="mt-6 rounded-xl border border-rule bg-white p-5 lg:p-6">
      <h3 className="font-medium text-ink mb-3 text-[15px]">{what}</h3>
      <dl className="space-y-2.5 text-[14px]">
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
          <dt className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3 sm:w-24 flex-shrink-0 pt-1">
            What
          </dt>
          <dd className="text-ink-2 leading-relaxed">{data}</dd>
        </div>
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
          <dt className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3 sm:w-24 flex-shrink-0 pt-1">
            Why
          </dt>
          <dd className="text-ink-2 leading-relaxed">{why}</dd>
        </div>
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
          <dt className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3 sm:w-24 flex-shrink-0 pt-1">
            How long
          </dt>
          <dd className="text-ink-2 leading-relaxed">{keep}</dd>
        </div>
      </dl>
    </div>
  );
}

function ContactBlock() {
  return (
    <div className="mt-4 rounded-xl border border-rule bg-white p-5">
      <div className="flex items-start gap-3">
        <Mail
          className="w-4 h-4 mt-1 flex-shrink-0"
          strokeWidth={2}
          style={{ color: "var(--brand)" }}
        />
        <div className="text-[14px] leading-relaxed">
          <p>
            <strong>aeTech Digital Hub</strong>
          </p>
          <p className="text-ink-2">Spintex Flower Port · Accra, Ghana</p>
          <p className="mt-1">
            <a
              href="mailto:ephraim@aetechdigitalhub.com"
              className="link-brand"
            >
              ephraim@aetechdigitalhub.com
            </a>
          </p>
          <p>
            <a href="tel:+233554448061" className="link-brand">
              +233 55 444 8061
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
