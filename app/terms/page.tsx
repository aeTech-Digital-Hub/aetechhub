import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

export const metadata = {
  title: "Terms of service",
  description:
    "The commercial terms under which aeTech Digital Hub delivers engineering work — written in plain language.",
  alternates: { canonical: "/terms" },
};

const LAST_UPDATED = "1 August 2026";

export default function TermsPage() {
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
            <p className="eyebrow mb-5">Terms of service</p>
            <h1 className="h-display text-[40px] sm:text-[48px] lg:text-[56px] tracking-tightest mb-4 leading-[1.02]">
              How we work{" "}
              <span className="italic font-light gradient-text">together.</span>
            </h1>
            <p className="text-[15px] lg:text-[16px] text-ink-2 leading-relaxed max-w-xl">
              The commercial terms for engineering work delivered by aeTech
              Digital Hub. Plain language, no fine print.
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
            <Section title="What these terms cover">
              <p>
                These terms apply when aeTech Digital Hub (&ldquo;we&rdquo;,
                &ldquo;us&rdquo;) delivers engineering, design, data, or
                security work for you (&ldquo;you&rdquo;, &ldquo;client&rdquo;).
                A signed Statement of Work (SOW) or written email confirmation
                is required before we begin any billable work.
              </p>
              <p>
                Individual SOWs override these general terms where they
                conflict. If nothing in a SOW addresses a topic, the rules below
                apply.
              </p>
            </Section>

            <Section title="Who we are">
              <p>
                aeTech Digital Hub is a Ghanaian engineering studio based at
                Spintex Flower Port, Accra. You can reach us at:
              </p>
              <ContactBlock />
            </Section>

            <Section title="How we scope work">
              <p>
                Before any commitment, we produce a written scope covering
                deliverables, timeline, price, exclusions, and payment terms.
                Nothing is verbal-only.
              </p>
              <ul className="mt-4">
                <li>
                  <strong>Fixed-fee.</strong> Most of our work is fixed-fee in
                  USD. Ghanaian clients may pay in GHS at the exchange rate
                  quoted in the SOW.
                </li>
                <li>
                  <strong>Retainer.</strong> Ongoing engagements are billed
                  monthly in advance with a defined scope of hours or
                  deliverables per month.
                </li>
                <li>
                  <strong>Advisory.</strong> Short engagements billed by the day
                  for review, planning, or technical due diligence.
                </li>
                <li>
                  <strong>Scope changes.</strong> Requests outside the agreed
                  scope require a written change order. We&apos;ll estimate the
                  impact before proceeding.
                </li>
              </ul>
            </Section>

            <Section title="Payment terms">
              <ul className="mt-4">
                <li>
                  <strong>Deposit.</strong> Most engagements require a 70%
                  deposit before work begins.
                </li>
                <li>
                  <strong>Balance.</strong> The remaining 30% is due on
                  delivery, unless the SOW specifies a different schedule.
                </li>
                <li>
                  <strong>Currency.</strong> USD is the reference currency for
                  all invoices. GHS payments are accepted at the exchange rate
                  quoted on the invoice.
                </li>
                <li>
                  <strong>Bank details.</strong> Payments are made to Fidelity
                  Bank Ghana, account details on each invoice.
                </li>
                <li>
                  <strong>Late payment.</strong> Invoices are due 14 days from
                  issue. Overdue invoices may incur a 2% monthly interest charge
                  from day 15.
                </li>
                <li>
                  <strong>Non-payment.</strong> If an invoice remains unpaid 30
                  days past due, we may pause work and withhold deliverables
                  until payment is received.
                </li>
              </ul>
            </Section>

            <Section title="Intellectual property">
              <p>
                Ownership of what we build for you passes to you on final
                payment. Specifically:
              </p>
              <ul className="mt-4">
                <li>
                  <strong>Your project deliverables.</strong> Source code,
                  designs, data models, reports, and documentation created
                  specifically for your project become your property when the
                  final invoice is paid in full.
                </li>
                <li>
                  <strong>Our tools and methods.</strong> Reusable code
                  libraries, internal tools, methodologies, and general
                  engineering knowledge developed by us over time remain our
                  property. We may reuse these on other engagements.
                </li>
                <li>
                  <strong>Third-party components.</strong> Open-source
                  libraries, licensed software, and third-party APIs are
                  governed by their own licenses. We&apos;ll flag any
                  significant licensing considerations in the SOW.
                </li>
                <li>
                  <strong>Portfolio rights.</strong> We may reference the
                  project in our portfolio, case studies, and marketing
                  materials unless the SOW says otherwise. If your work is under
                  NDA, tell us before signing.
                </li>
              </ul>
            </Section>

            <Section title="Delivery and acceptance">
              <ul className="mt-4">
                <li>
                  <strong>Timelines.</strong> We meet the timelines in each SOW
                  barring client delays or scope changes.
                </li>
                <li>
                  <strong>Client delays.</strong> If we&apos;re blocked awaiting
                  your input, feedback, or materials for more than 7 business
                  days, we may adjust the timeline and reserve the right to
                  invoice work-in-progress.
                </li>
                <li>
                  <strong>Acceptance.</strong> We&apos;ll notify you when a
                  deliverable is ready for review. You have 10 business days to
                  accept, reject with specific reasons, or request revisions
                  within the agreed scope. Silence past 10 business days is
                  treated as acceptance.
                </li>
                <li>
                  <strong>Post-launch support.</strong> Most engagements include
                  30 days of bug-fixing after delivery. New feature requests are
                  billed separately.
                </li>
              </ul>
            </Section>

            <Section title="Warranties">
              <p>
                We warrant that our work will conform to the agreed scope and
                will be performed with the skill and care expected of senior
                engineers.
              </p>
              <p>
                Beyond that, deliverables are provided &ldquo;as is&rdquo;. We
                don&apos;t warrant that software will be uninterrupted,
                error-free, or free from security vulnerabilities beyond what
                reasonable engineering practices can achieve.
              </p>
              <p>
                For security-related work (penetration testing, audits), we
                warrant a thorough, professional assessment. We do not warrant
                that we&apos;ve found every possible vulnerability — no security
                assessment can promise that.
              </p>
            </Section>

            <Section title="Limitation of liability">
              <p>To the fullest extent permitted by Ghanaian law:</p>
              <ul className="mt-4">
                <li>
                  Our total liability for any engagement is capped at the total
                  fees paid to us under that engagement.
                </li>
                <li>
                  We are not liable for indirect, consequential, or incidental
                  damages — including lost profits, lost data where reasonable
                  backup practices would have prevented loss, or business
                  interruption.
                </li>
                <li>
                  Nothing in these terms limits liability for gross negligence,
                  willful misconduct, or matters that cannot be limited by law.
                </li>
              </ul>
            </Section>

            <Section title="Confidentiality">
              <p>
                We keep confidential anything you tell us that a reasonable
                person would treat as confidential. We won&apos;t share your
                data, code, business plans, or strategic information with third
                parties without your permission — except where legally required.
              </p>
              <p>
                We&apos;re happy to sign a formal NDA before receiving sensitive
                information. Ask.
              </p>
            </Section>

            <Section title="Termination">
              <ul className="mt-4">
                <li>
                  <strong>For convenience.</strong> Either party may terminate
                  an engagement with 14 days&apos; written notice. You pay for
                  work completed up to the termination date.
                </li>
                <li>
                  <strong>For cause.</strong> Either party may terminate
                  immediately if the other materially breaches the SOW and fails
                  to cure the breach within 14 days of written notice.
                </li>
                <li>
                  <strong>What survives.</strong> Payment obligations,
                  intellectual property rights, confidentiality, and limitation
                  of liability survive any termination.
                </li>
              </ul>
            </Section>

            <Section title="Independent contractor relationship">
              <p>
                We work as an independent contractor. Nothing in an engagement
                creates an employment, partnership, joint venture, or agency
                relationship. Neither party can bind the other to third-party
                commitments without written authorization.
              </p>
            </Section>

            <Section title="Dispute resolution">
              <p>
                We&apos;d rather solve problems directly than in court. Before
                any formal proceeding, both parties agree to meet in good faith
                to try to resolve the dispute.
              </p>
              <p>
                If that fails, disputes are governed by the laws of Ghana and
                subject to the exclusive jurisdiction of the courts of Accra,
                Ghana.
              </p>
            </Section>

            <Section title="Changes to these terms">
              <p>
                These terms may be updated occasionally. The &ldquo;Last
                updated&rdquo; date at the top of this page shows the latest
                revision. For engagements already in flight, the terms in effect
                at the time of the SOW apply — you don&apos;t get subject to
                changes retroactively.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                Questions about these terms, or want us to sign a specific
                agreement instead?
              </p>
              <ContactBlock />
            </Section>

            {/* Disclaimer */}
            <div className="mt-16 pt-8 border-t border-rule">
              <p className="text-[12px] text-ink-3 italic leading-relaxed">
                These terms describe our normal working practices in plain
                language. They are not legal advice. If you need a legal
                interpretation of your rights or the enforceability of specific
                clauses, please consult a qualified lawyer in your jurisdiction.
                For engagements involving specific legal or regulatory concerns,
                we&apos;re happy to sign an agreement drafted by your legal team
                instead.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

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
