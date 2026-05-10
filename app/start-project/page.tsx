import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { StartProjectExperience } from "@/components/forms/StartProjectExperience";

export const metadata = {
  title: "Start a project",
  description:
    "Tell us about your project. We'll review and reply with a written scope and an honest estimate within 48 hours.",
};

export default function StartProjectPage() {
  return (
    <>
      {/* ─────────────────────────────────────────
          PAGE HEADER — centered, restrained
          ───────────────────────────────────────── */}
      <section className="container-px pt-28 pb-12 lg:pt-36 lg:pb-16 bg-base">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              Back home
            </Link>
            <p className="eyebrow mb-5">Start a project</p>
            <h1 className="h-display text-[40px] sm:text-[52px] lg:text-[64px] tracking-tightest mb-5 leading-[1.02]">
              Tell us about{" "}
              <span className="font-light gradient-text">
                your project.
              </span>
            </h1>
            <p className="text-[16px] lg:text-[17px] text-ink-2 leading-relaxed max-w-xl mx-auto">
              Three short steps. We&apos;ll review and come back with a written
              scope and an honest estimate within 48 hours.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          FORM EXPERIENCE — centered → splits to left + summary on right
          ───────────────────────────────────────── */}
      <section className="container-px pb-32 lg:pb-40 bg-base">
        <Reveal>
          <StartProjectExperience />
        </Reveal>
      </section>
    </>
  );
}
