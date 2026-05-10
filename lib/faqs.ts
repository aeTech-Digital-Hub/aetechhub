export type FAQ = {
  q: string;
  a: string;
};

export const FAQS: FAQ[] = [
  {
    q: "How do you charge for projects?",
    a: "Most engagements are fixed-fee against a written scope. For longer or open-ended work we offer a monthly retainer. We never charge by the hour for delivery work — it punishes both sides for being efficient.",
  },
  {
    q: "How long does a typical project take?",
    a: "A marketing site or product website usually ships in 4–6 weeks. A SaaS platform takes 3–6 months depending on scope. We give you a written timeline with weekly checkpoints before any contract is signed.",
  },
  {
    q: "Do you only work with clients in Ghana?",
    a: "No. We have shipped for clients in Ghana, Nigeria, the UK, and the US. Most of our work happens asynchronously over email and shared documents, with a weekly video call.",
  },
  {
    q: "Will I be working with the senior who scoped the project?",
    a: "Yes — that is the whole point. The person who scopes your project is the person who builds it. There is no hand-off to a junior team after the contract is signed.",
  },
  {
    q: "What happens after the project ships?",
    a: "You get 30 days of post-launch support included — bug fixes, small refinements, and questions answered. After that you can hire us on retainer for ongoing work, or take everything in-house. We hand over clean code, documentation, and an introduction call with whoever takes it on.",
  },
  {
    q: "Do you sign NDAs?",
    a: "Yes, before we discuss anything specific. Send us the agreement and we will sign it the same day.",
  },
];
