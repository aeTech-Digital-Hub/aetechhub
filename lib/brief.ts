/**
 * Structured brief — the seven sections we ask clients to fill in.
 *
 * Each section has:
 *   – id: short key, used in storage and the URL hash
 *   – title: the human-facing prompt
 *   – question: the underlying question we're trying to surface
 *   – placeholder: example text in the textarea
 *   – tipsFor(value, allValues): returns 0-3 contextual tips based on what they've typed.
 *     Pure logic — no AI. Pulls signal from word count, missing concepts,
 *     and cross-section consistency.
 */

export type BriefSectionId =
  | "aboutYou"
  | "problem"
  | "success"
  | "tried"
  | "constraints"
  | "risks"
  | "anythingElse";

export type StructuredBrief = Record<BriefSectionId, string>;

export const EMPTY_BRIEF: StructuredBrief = {
  aboutYou: "",
  problem: "",
  success: "",
  tried: "",
  constraints: "",
  risks: "",
  anythingElse: "",
};

export type BriefSection = {
  id: BriefSectionId;
  number: string;
  title: string;
  question: string;
  description: string;
  placeholder: string;
  /** What we look for when judging completeness */
  good: string[];
  /** Soft minimum word count for the section to count as "filled enough" */
  minWords: number;
};

export const BRIEF_SECTIONS: BriefSection[] = [
  {
    id: "aboutYou",
    number: "I",
    title: "About you",
    question: "Who are you, and what does your business do today?",
    description:
      "A short paragraph about you and your company. We don't need a pitch — just enough that we know who's at the table.",
    placeholder:
      "We're a three-person team in Accra running a B2B fintech serving small importers. We've been live for 18 months and have ~600 active customers paying us monthly…",
    good: [
      "Who you are personally (your role)",
      "What the company does in one sentence",
      "How long you have been operating",
      "Rough size — team, customers, revenue",
    ],
    minWords: 25,
  },
  {
    id: "problem",
    number: "II",
    title: "The problem",
    question: "What problem are you trying to solve?",
    description:
      "Be specific. The clearer the problem, the better we can scope a solution. Vague problems get vague proposals.",
    placeholder:
      "Our admin team spends 15 hours a week reconciling payments across three banks because our existing platform doesn't sync them. As we grow, this is becoming impossible to keep up with…",
    good: [
      "A concrete pain point, not a feature wishlist",
      "Who experiences the problem and how often",
      "What it costs you (time, money, missed opportunity)",
      "Why now — what changed?",
    ],
    minWords: 40,
  },
  {
    id: "success",
    number: "III",
    title: "What success looks like",
    question: "How will you know we got it right?",
    description:
      "If we ship something and you have to ask whether it's working, the brief was wrong. Tell us what good looks like.",
    placeholder:
      "Reconciliation goes from 15 hours/week to under 2. The admin team is freed up to handle customer service. We can confidently bring on 50 new customers a month without scaling our admin team…",
    good: [
      "A measurable outcome (numbers if possible)",
      "A behaviour change (what someone now does or stops doing)",
      "A timeline for when this matters",
    ],
    minWords: 25,
  },
  {
    id: "tried",
    number: "IV",
    title: "What you've tried",
    question: "What have you tried already, and what did you learn?",
    description:
      "We're not your first conversation about this. Tell us what you tried, what worked, what didn't, and what made you pick up the phone today.",
    placeholder:
      "We tried two no-code platforms last year — they couldn't handle our reconciliation logic. We then hired a freelancer who built a prototype but disappeared after three months…",
    good: [
      "Past attempts (tools, hires, in-house projects)",
      "What didn't work and why",
      "What you learned from the attempts",
      "What you would NOT want to repeat",
    ],
    minWords: 25,
  },
  {
    id: "constraints",
    number: "V",
    title: "Constraints",
    question: "What are your constraints — budget, timeline, people, tech?",
    description:
      "Constraints are gifts. They focus the work. Be honest — vague budgets always lead to misaligned proposals.",
    placeholder:
      "Budget: $8,000-$15,000 USD. Timeline: live by end of Q2 ideally. Team: I have a part-time designer in-house, no engineers. Tech: must integrate with our existing Stripe and our bank's API…",
    good: [
      "Budget range (USD or GHS — we work in both)",
      "Timeline (deadline driven? flexible?)",
      "Internal people who will be part of the work",
      "Tech requirements (must-integrate, must-not-use)",
    ],
    minWords: 25,
  },
  {
    id: "risks",
    number: "VI",
    title: "Risks and unknowns",
    question: "What could go wrong, and what are you unsure about?",
    description:
      "Surfaces honesty. The things you don't know matter as much as the things you do. We'd rather hear them now than discover them in week 6.",
    placeholder:
      "We don't know how our bank's API behaves under load — they don't publish docs. We're also not sure if our team can maintain a custom system after handover…",
    good: [
      "Technical unknowns",
      "Organisational risks (key people, decision-making)",
      "External dependencies (third parties, regulators)",
      'What you would call a "deal-breaker"',
    ],
    minWords: 20,
  },
  {
    id: "anythingElse",
    number: "VII",
    title: "Anything else",
    question: "What else should we know?",
    description:
      "Context that doesn't fit anywhere else. References, links, things that have inspired you, things that worry you.",
    placeholder:
      "We love how Stripe Atlas explains complex things simply. Worried about scope creep — we've been burnt before. Open to phased approach if it's the right thing…",
    good: [
      "References or inspiration",
      "Concerns or hesitations",
      "Anything you want us to know off the record",
    ],
    minWords: 0,
  },
];

// ─────────────────────────────────────────
// TIPS — section-level + cross-section
// ─────────────────────────────────────────

export type Tip = {
  /** What to say to the writer */
  message: string;
  /** Severity tone — `nudge` is encouragement, `gap` is a missing piece, `polish` is making it better */
  kind: "nudge" | "gap" | "polish";
};

function wordsIn(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

const NUMBER_RX =
  /\b(\d+(?:[,.]\d+)?)\b|\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million)\b/i;
const TIME_RX = /(week|month|quarter|year|day|q[1-4]|asap|deadline|by\s+\w+)/i;
const MONEY_RX =
  /(\$|usd|ghs|cedis|budget|cost|price|invest|k\b|thousand|million)/i;

/**
 * Returns up to 3 contextual tips for a single section based on what they've written
 * AND what they've written elsewhere. Pure deterministic logic.
 */
export function tipsFor(
  sectionId: BriefSectionId,
  value: string,
  allValues: StructuredBrief,
): Tip[] {
  const tips: Tip[] = [];
  const wc = wordsIn(value);
  const section = BRIEF_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return tips;

  // Section-specific heuristics
  if (sectionId === "problem") {
    if (wc > 0 && wc < 20) {
      tips.push({
        kind: "gap",
        message:
          "This feels short. The clearer the problem, the better we can scope a solution.",
      });
    }
    if (wc >= 10 && !NUMBER_RX.test(value)) {
      tips.push({
        kind: "polish",
        message:
          "Try adding a number — hours wasted, customers affected, money lost. Numbers anchor problems.",
      });
    }
    if (
      wc >= 10 &&
      !/\b(why now|recently|now|this year|growth|change)/i.test(value)
    ) {
      tips.push({
        kind: "nudge",
        message:
          '"Why now?" is one of our favourite questions — what changed that made you reach out today?',
      });
    }
  }

  if (sectionId === "success") {
    if (wc > 0 && !NUMBER_RX.test(value)) {
      tips.push({
        kind: "polish",
        message:
          "Measurable outcomes are easier to ship against. Try a number, percentage, or duration.",
      });
    }
    if (wc > 0 && !TIME_RX.test(value)) {
      tips.push({
        kind: "nudge",
        message:
          "When does success need to happen? A timeframe makes the goal real.",
      });
    }
  }

  if (sectionId === "constraints") {
    if (wc > 0 && !MONEY_RX.test(value)) {
      tips.push({
        kind: "gap",
        message:
          'Budget is the constraint that affects scope most. A range is fine — "$5k-$15k" is more useful than nothing.',
      });
    }
    if (wc > 0 && !TIME_RX.test(value)) {
      tips.push({
        kind: "gap",
        message: "A timeline — even a vague one — helps us prioritise.",
      });
    }
  }

  if (sectionId === "tried") {
    if (wc > 0 && wc < 15) {
      tips.push({
        kind: "nudge",
        message:
          'Even "we have not tried anything yet" is useful — tell us why.',
      });
    }
  }

  if (sectionId === "risks") {
    if (
      wc > 0 &&
      !/\b(don't know|unknown|unsure|risk|might|could|worry|concern)/i.test(
        value,
      )
    ) {
      tips.push({
        kind: "polish",
        message:
          'Try framing one thing as "we don\'t know..." — it surfaces real risk.',
      });
    }
  }

  // Cross-section consistency tips
  if (sectionId === "success" && allValues.problem && wc > 0) {
    const problemHasNumbers = NUMBER_RX.test(allValues.problem);
    const successHasNumbers = NUMBER_RX.test(value);
    if (problemHasNumbers && !successHasNumbers) {
      tips.push({
        kind: "polish",
        message:
          "You quantified the problem upstream — try matching the success criteria to that number.",
      });
    }
  }

  // Generic length encouragement (only if no other tips)
  if (tips.length === 0 && wc > 0 && wc < section.minWords) {
    tips.push({
      kind: "nudge",
      message: `A bit more detail would help — aim for around ${section.minWords} words.`,
    });
  }

  return tips.slice(0, 3);
}

// ─────────────────────────────────────────
// COMPLETION + RECOMMENDATIONS
// ─────────────────────────────────────────

export function completionPercent(values: StructuredBrief): number {
  let filled = 0;
  for (const s of BRIEF_SECTIONS) {
    const wc = wordsIn(values[s.id]);
    // Each section counts proportionally toward its minWords, capped at 1
    if (s.minWords === 0) {
      filled += values[s.id].trim().length > 0 ? 1 : 0;
    } else {
      filled += Math.min(wc / s.minWords, 1);
    }
  }
  return Math.round((filled / BRIEF_SECTIONS.length) * 100);
}

/** Returns a short fingerprint summary of which sections are weak, for admin priority */
export function priorityScore(values: StructuredBrief): {
  level: "low" | "medium" | "high";
  filled: number;
  total: number;
} {
  const total = BRIEF_SECTIONS.length;
  let filled = 0;
  for (const s of BRIEF_SECTIONS) {
    if (wordsIn(values[s.id]) >= s.minWords) filled++;
  }
  const ratio = filled / total;
  return {
    level: ratio > 0.7 ? "high" : ratio > 0.3 ? "medium" : "low",
    filled,
    total,
  };
}
