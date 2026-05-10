"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import { FAQS, type FAQ } from "@/lib/faqs";

/**
 * FAQs — accordion section. Single-open behaviour: opening one closes others.
 * Pure typography + hairlines, no cards (matches the about-page restraint).
 */
export function FAQs() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <section className="container-px py-24 lg:py-32 bg-base border-t border-rule">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
        {/* Heading column */}
        <div className="lg:col-span-4">
          <Reveal>
            <p className="eyebrow mb-4">Questions</p>
            <h2 className="h-display text-[32px] lg:text-[44px] tracking-tighter mb-4">
              Common questions,{" "}
              <span className="font-light gradient-text">answered.</span>
            </h2>
            <p className="text-[15px] text-ink-2 leading-relaxed max-w-sm">
              Things people ask before they hire us. If yours isn&apos;t here,
              write to us — the answer will probably end up here too.
            </p>
          </Reveal>
        </div>

        {/* Accordion column */}
        <div className="lg:col-span-8">
          <Reveal delay={0.1}>
            <div className="border-t border-rule">
              {FAQS.map((f, i) => {
                const isOpen = openIdx === i;
                return (
                  <div key={f.q} className="border-b border-rule">
                    <button
                      onClick={() => setOpenIdx(isOpen ? null : i)}
                      className="w-full text-left py-6 lg:py-7 flex items-start justify-between gap-6 group"
                      aria-expanded={isOpen}
                    >
                      <span className="text-[16px] lg:text-[17px] font-medium text-ink leading-snug pr-2">
                        {f.q}
                      </span>
                      <span
                        className={`flex-shrink-0 mt-0.5 transition-transform duration-300 ${
                          isOpen ? "rotate-45" : ""
                        }`}
                        style={{ color: "var(--brand)" }}
                      >
                        <Plus className="w-5 h-5" strokeWidth={1.75} />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="content"
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={reduce ? undefined : { height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="overflow-hidden"
                        >
                          <p className="text-[15px] lg:text-[16px] text-ink-2 leading-relaxed pb-6 lg:pb-7 pr-12 lg:max-w-2xl">
                            {f.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
