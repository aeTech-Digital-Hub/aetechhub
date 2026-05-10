import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { BriefExperience } from "@/components/brief/BriefExperience";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Write your brief",
  description:
    "A guided editor for writing a project brief — seven sections, contextual tips, autosaved as you go.",
};

export default async function BriefPage() {
  // Auth gate — brief is the one form that requires an account.
  // Anonymous visitors get sent to sign-in with /brief as the next URL.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in?next=" + encodeURIComponent("/brief"));
  }

  // Derive a guaranteed-string display name. JWT payload allows `name` to be
  // optional, but downstream components want a real string.
  const displayName = user.name?.trim() || user.email.split("@")[0] || "there";

  return (
    <>
      {/* Header */}
      <section className="container-px pt-28 pb-10 lg:pt-36 lg:pb-12 bg-base">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink mb-10 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
              Back home
            </Link>
            <p className="eyebrow mb-5">Write your brief</p>
            <h1 className="h-display text-[40px] sm:text-[52px] lg:text-[60px] tracking-tightest mb-5 leading-[1.02]">
              Hi {displayName.split(" ")[0]} — let&apos;s tell us about{" "}
              <span className="italic font-light gradient-text">
                your project.
              </span>
            </h1>
            <p className="text-[15px] lg:text-[16px] text-ink-2 leading-relaxed max-w-xl mx-auto mb-7">
              Twenty minutes, seven sections, autosaves as you write. We&apos;ll
              reply with a written scope and an estimate within 48 hours.
            </p>
            <Link
              href="/brief/guide"
              className="inline-flex items-center gap-1.5 text-[13px] link-brand"
            >
              <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
              Read the guide first
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Experience — receives authenticated user, skips contact gate */}
      <section className="container-px pb-32 lg:pb-40 bg-base">
        <BriefExperience
          authedUser={{
            name: displayName,
            email: user.email,
          }}
        />
      </section>
    </>
  );
}
