import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";

export const metadata = {
  title: "Brief received",
  robots: { index: false, follow: false },
};

export default async function BriefDonePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <section className="container-px py-32 lg:py-44 bg-base">
      <div className="max-w-2xl mx-auto text-center">
        <Reveal>
          <div
            className="w-12 h-12 rounded-full grid place-items-center mx-auto mb-8"
            style={{ background: "var(--brand-100)" }}
          >
            <CheckCircle2
              className="w-5 h-5"
              strokeWidth={2}
              style={{ color: "var(--brand)" }}
            />
          </div>

          <p className="eyebrow mb-5">Brief received</p>
          <h1 className="h-display text-[36px] sm:text-[44px] lg:text-[52px] tracking-tightest mb-5 leading-[1.02]">
            Thank you. We&apos;ll{" "}
            <span className="italic font-light gradient-text">
              be in touch.
            </span>
          </h1>

          <p className="text-[16px] text-ink-2 leading-relaxed mb-10 max-w-md mx-auto">
            We&apos;ll review your brief carefully and reply within 48 hours —
            either with a written scope and an estimate, or with one or two
            clarifying questions.
          </p>

          {id && (
            <p className="text-[12px] font-mono text-ink-3 mb-10">
              Reference: <span className="text-ink-2">{id}</span>
            </p>
          )}

          <div className="flex items-center justify-center flex-wrap gap-3">
            <Link href="/" className="btn-primary lift">
              Back home
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
            <Link href="/projects" className="btn-ghost lift">
              See our work
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
