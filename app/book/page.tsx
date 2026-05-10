import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { BookExperience } from "@/components/forms/BookExperience";

export const metadata = {
  title: "Book a call",
  description:
    "A short conversation to understand what you're trying to build, and whether we're the right team to help.",
};

export default function BookPage() {
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
            <p className="eyebrow mb-5">Book a 30-min call</p>
            <h1 className="h-display text-[40px] sm:text-[52px] lg:text-[64px] tracking-tightest mb-5 leading-[1.02]">
              Let&apos;s have{" "}
              <span className="italic font-light gradient-text">
                a conversation.
              </span>
            </h1>
            <p className="text-[16px] lg:text-[17px] text-ink-2 leading-relaxed max-w-xl mx-auto">
              A short call to understand what you&apos;re trying to build, and
              whether we&apos;re the right team to help. No prep needed.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────────
          BOOKING — left panel + form
          ───────────────────────────────────────── */}
      <section className="container-px pb-32 lg:pb-40 bg-base">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <BookExperience />
          </Reveal>
        </div>
      </section>
    </>
  );
}
