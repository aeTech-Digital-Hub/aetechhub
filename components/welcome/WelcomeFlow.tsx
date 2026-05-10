"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { WelcomeAtmosphere } from "./WelcomeAtmosphere";

// Stage timings (ms)
const TIMINGS = {
  hello: 1200,
  welcome: 1400,
  intro: 1600,
  thanks: 1200,
};

// Memory key — survives refreshes, lets us skip the welcome on return visits
const STORAGE_KEY = "aetech_welcomed";
export const WELCOME_FLAG_KEY = STORAGE_KEY;

type Choice = {
  id: string;
  label: string;
  /** Where to take them after the welcome flow */
  href: string;
  /** A one-line note shown in the summary stage */
  summary: string;
};

const CHOICES: Choice[] = [
  {
    id: "web",
    label: "A website or product",
    href: "/services/web-product",
    summary: "Custom websites and product surfaces.",
  },
  {
    id: "saas",
    label: "A SaaS platform",
    href: "/services/saas",
    summary: "Multi-tenant platforms, end to end.",
  },
  {
    id: "data",
    label: "Data, analytics, or ML",
    href: "/services/data-analysis",
    summary: "Pipelines, dashboards, and machine learning.",
  },
  {
    id: "security",
    label: "A security review",
    href: "/services/security-analysis",
    summary: "Architecture audits and adversarial testing.",
  },
  {
    id: "brief",
    label: "I'll write a detailed brief",
    href: "/brief/guide",
    summary: "We'll walk you through a guided editor.",
  },
];

type Stage = "hello" | "welcome" | "intro" | "question" | "thanks";

export function WelcomeFlow({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("hello");
  const [choice, setChoice] = useState<Choice | null>(null);
  const skippedRef = useRef(false);

  // Auto-advance timer — drives the early stages forward, kills itself if user skips
  useEffect(() => {
    if (skippedRef.current) return;
    if (stage === "question") return; // user-driven from here

    let next: Stage | null = null;
    let delay = 0;
    if (stage === "hello") {
      next = "welcome";
      delay = reduce ? 0 : TIMINGS.hello;
    } else if (stage === "welcome") {
      next = "intro";
      delay = reduce ? 0 : TIMINGS.welcome;
    } else if (stage === "intro") {
      next = "question";
      delay = reduce ? 0 : TIMINGS.intro;
    } else if (stage === "thanks") {
      // After the thanks stage, redirect
      delay = reduce ? 0 : TIMINGS.thanks;
      const t = setTimeout(() => {
        markWelcomed();
        router.push(choice?.href || redirectTo);
      }, delay);
      return () => clearTimeout(t);
    }

    if (!next) return;
    const t = setTimeout(() => setStage(next!), delay);
    return () => clearTimeout(t);
  }, [stage, reduce, choice, redirectTo, router]);

  function handleChoice(c: Choice) {
    setChoice(c);
    setStage("thanks");
  }

  function skip() {
    skippedRef.current = true;
    markWelcomed();
    router.push(redirectTo);
  }

  // For reduced motion, condense intro stages into the question stage immediately
  useEffect(() => {
    if (
      reduce &&
      (stage === "hello" || stage === "welcome" || stage === "intro")
    ) {
      setStage("question");
    }
  }, [reduce, stage]);

  return (
    <div className="relative min-h-[100dvh] bg-base overflow-hidden flex flex-col">
      {/* Layered atmospheric backdrop — mesh + dot grid + ornaments + vignette */}
      <WelcomeAtmosphere />

      {/* Top bar — status pill + stage dots + skip */}
      <header className="container-px relative z-20 pt-8 pb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-rule bg-white/60 backdrop-blur-sm">
            <span
              className="status-dot w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--brand)" }}
            />
            <span className="text-[11.5px] font-mono tracking-wide text-ink-2">
              Quick welcome · skip anytime
            </span>
          </div>

          {/* Stage progress dots — 4 stages: hello/welcome/intro collapsed → question → thanks */}
          <StageDots stage={stage} />
        </div>

        <button
          onClick={skip}
          className="text-[13px] text-ink-2 hover:text-ink transition-colors inline-flex items-center gap-1.5 group"
        >
          Skip to site
          <ArrowRight
            className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
          />
        </button>
      </header>

      {/* Stage area — vertically centered */}
      <main className="container-px relative z-10 flex-1 flex items-center justify-center pb-20">
        <div className="w-full max-w-3xl text-center">
          {/* Memory lane — past lines fade to soft, current line is bold + gradient */}
          <div className="space-y-2 mb-10 lg:mb-14">
            {/* Past line: hello (visible from welcome onward) */}
            <AnimatePresence>
              {stage !== "hello" && (
                <motion.p
                  key="past-hello"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-display text-[28px] sm:text-[36px] tracking-tighter text-ink-3 font-light"
                >
                  Hello.
                </motion.p>
              )}
            </AnimatePresence>

            {/* Past line: welcome (visible from intro onward) */}
            <AnimatePresence>
              {(stage === "intro" ||
                stage === "question" ||
                stage === "thanks") && (
                <motion.p
                  key="past-welcome"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-display text-[28px] sm:text-[36px] tracking-tighter text-ink-3 font-light"
                >
                  Welcome to aeTech.
                </motion.p>
              )}
            </AnimatePresence>

            {/* Past line: intro (visible from question onward) */}
            <AnimatePresence>
              {(stage === "question" || stage === "thanks") && (
                <motion.p
                  key="past-intro"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-display text-[20px] sm:text-[24px] tracking-tighter text-ink-3 font-light max-w-2xl mx-auto"
                >
                  We design and build software, end to end.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Current line — large, gradient italic on key word */}
          <AnimatePresence mode="wait">
            {stage === "hello" && (
              <Line key="hello" delay={reduce ? 0 : 0.1}>
                <span className="font-light gradient-text">Hello.</span>
              </Line>
            )}

            {stage === "welcome" && (
              <Line key="welcome">
                Welcome to{" "}
                <span className="font-light gradient-text">aeTech.</span>
              </Line>
            )}

            {stage === "intro" && (
              <Line key="intro">
                We design and build{" "}
                <span className="font-light gradient-text">
                  software,
                </span>
                <br />
                end to end.
              </Line>
            )}

            {stage === "question" && (
              <motion.div
                key="question"
                initial={
                  reduce ? false : { opacity: 0, y: 16, filter: "blur(12px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduce
                    ? undefined
                    : { opacity: 0, y: -16, filter: "blur(8px)" }
                }
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="h-display text-[42px] sm:text-[56px] lg:text-[68px] tracking-tightest leading-[1.02] mb-12 lg:mb-16">
                  What brings you
                  <br />
                  <span className="font-light gradient-text">
                    here today?
                  </span>
                </h1>

                {/* Choices */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto mb-10">
                  {CHOICES.map((c, i) => (
                    <motion.button
                      key={c.id}
                      onClick={() => handleChoice(c)}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: reduce ? 0 : 0.2 + i * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="px-5 py-2.5 rounded-full border border-rule bg-white/80 backdrop-blur-sm text-[14px] text-ink hover:bg-ink hover:text-white hover:border-ink transition-all"
                    >
                      {c.label}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  onClick={skip}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: reduce ? 0 : 0.7, duration: 0.5 }}
                  className="text-[13px] text-ink-2 hover:text-ink transition-colors inline-flex items-center gap-1.5 group"
                >
                  I&apos;m just exploring
                  <ArrowUpRight
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={2}
                  />
                </motion.button>
              </motion.div>
            )}

            {stage === "thanks" && choice && (
              <motion.div
                key="thanks"
                initial={
                  reduce ? false : { opacity: 0, y: 16, filter: "blur(12px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <h2 className="h-display text-[36px] sm:text-[48px] lg:text-[56px] tracking-tightest leading-[1.05] mb-6">
                  <span className="font-light gradient-text">
                    Perfect.
                  </span>
                  <br />
                  Let&apos;s show you the right place.
                </h2>
                <p className="text-[15px] lg:text-[16px] text-ink-2 max-w-md mx-auto leading-relaxed">
                  {choice.summary}
                </p>

                {/* Tiny inline loader bar to telegraph "we're going somewhere" */}
                {!reduce && (
                  <motion.div className="mt-10 h-px max-w-xs mx-auto rounded-full overflow-hidden bg-rule">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: TIMINGS.thanks / 1000,
                        ease: "linear",
                      }}
                      className="h-full"
                      style={{ background: "var(--brand)" }}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function Line({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.h1
      initial={reduce ? false : { opacity: 0, y: 16, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={reduce ? undefined : { opacity: 0, y: -16, filter: "blur(8px)" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className="h-display text-[56px] sm:text-[80px] lg:text-[112px] tracking-tightest leading-[0.98]"
    >
      {children}
    </motion.h1>
  );
}

function markWelcomed() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private mode — ignore */
  }
}

/**
 * Stage progress dots in the top bar.
 *  – Shows 4 small pills representing the 4 phases of the flow
 *  – The active one widens + fills with brand purple
 *  – Past ones stay filled but small; future ones are unfilled
 */
function StageDots({ stage }: { stage: Stage }) {
  // Combine hello/welcome/intro into one "intro" phase for the dots — keeps the bar clean
  const phases: { key: Stage[]; label: string }[] = [
    { key: ["hello", "welcome", "intro"], label: "Intro" },
    { key: ["question"], label: "Question" },
    { key: ["thanks"], label: "Done" },
  ];

  // Find the active phase index
  const activeIdx = phases.findIndex((p) => p.key.includes(stage));

  return (
    <div className="hidden sm:flex items-center gap-1.5">
      {phases.map((p, i) => {
        const active = i === activeIdx;
        const past = i < activeIdx;
        return (
          <span
            key={p.label}
            aria-label={p.label}
            className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              active ? "w-7" : "w-1.5"
            }`}
            style={{
              background: active || past ? "var(--brand)" : "var(--rule)",
              opacity: past ? 0.4 : 1,
            }}
          />
        );
      })}
    </div>
  );
}
