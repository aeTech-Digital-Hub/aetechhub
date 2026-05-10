export type Testimonial = {
  /** The quote itself. Keep to 2–3 sentences. */
  quote: string;
  /** Person who said it. */
  author: string;
  /** Their role + company. */
  role: string;
  /** Optional — initials shown in the avatar circle. Auto-derived if absent. */
  initials?: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We had been burnt twice before by agencies promising the world. aeTech scoped the project honestly, told us what was realistic, and shipped exactly what they said they would.",
    author: "Karen Dazie",
    role: "Director, Black Cowry",
  },
  {
    quote:
      "The team is calm in the way you want senior engineers to be calm. No drama, no surprises, no last-minute rewrites. They told us what would take time and what wouldn't, and they were right both times.",
    author: "Mariam Goba",
    role: "Founder, Malawi Village",
  },
  {
    quote:
      "What I appreciated most was the honesty about scope. They turned down work they didn't think was right for us. That's not something most hubs do — and it's why we kept coming back.",
    author: "Samuel Darlinton",
    role: "CEO, SmileBaba Hub",
  },
];
