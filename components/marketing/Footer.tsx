"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      setDone(true);
    } catch {
      /* silent — non-critical */
    }
  }

  const year = new Date().getFullYear();

  return (
    // ─── Outer wrapper now uses brand purple (was bg-ink / black) ───
    <footer
      className="pt-16 lg:pt-20 px-4"
      style={{ background: "var(--brand)" }}
    >
      {/* Light card — sits on top of the brand-purple wrapper */}
      <div className="max-w-[1350px] mx-auto bg-base text-ink rounded-t-3xl overflow-hidden">
        <div className="px-6 sm:px-10 md:px-16 lg:px-24 pt-12 lg:pt-16">
          {/* TOP — newsletter + columns */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 pb-12 lg:pb-16">
            {/* LEFT — brand + newsletter + socials */}
            <div className="space-y-7">
              <Link href="/" className="inline-flex items-center gap-3">
                <Image
                  src="/aetech-logo.png"
                  alt="aeTech Digital Hub"
                  width={36}
                  height={36}
                  className="w-9 h-9 object-contain"
                  style={{ height: "auto" }}
                />
                <span className="h-display text-[20px] tracking-tight">
                  ae<span className="font-light">Tech</span>{" "}
                  <span className="text-ink-2 font-light">Digital Hub</span>
                </span>
              </Link>

              <p className="text-[14px] text-ink-2 max-w-md leading-relaxed">
                An engineering studio in Accra, Ghana. We design and build
                websites, SaaS platforms, and the systems beneath them — for
                teams that need it done by senior engineers, end to end.
              </p>

              <form onSubmit={subscribe} className="max-w-md">
                <p className="eyebrow mb-3">Quiet, occasional dispatches</p>
                <div className="flex items-stretch gap-0 border border-rule rounded-full overflow-hidden bg-white">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent px-5 py-2.5 text-[14px] text-ink placeholder:text-ink-3 outline-none"
                    required
                  />
                  <button
                    className="px-4 text-[13px] font-medium flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    style={{ color: "var(--brand)" }}
                  >
                    {done ? "Thanks ✓" : "Subscribe"}
                    {!done && (
                      <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
                    )}
                  </button>
                </div>
                <p className="text-[12px] text-ink-3 mt-3 leading-relaxed">
                  Notes on engineering, design, and the businesses we build
                  with. No marketing.
                </p>
              </form>

              <div className="flex items-center gap-5 pt-1">
                <SocialLink href="https://twitter.com" label="Twitter">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                </SocialLink>
                <SocialLink href="https://github.com" label="Github">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </SocialLink>
                <SocialLink href="https://linkedin.com" label="LinkedIn">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </SocialLink>
                <SocialLink href="https://instagram.com" label="Instagram">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </SocialLink>
              </div>
            </div>

            {/* RIGHT — link columns (Legal column added) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 items-start">
              <FooterCol title="Hub">
                <FooterLink href="/services">Services</FooterLink>
                <FooterLink href="/projects">Work</FooterLink>
                <FooterLink href="/research">Research</FooterLink>
                <FooterLink href="/about">About</FooterLink>
              </FooterCol>

              <FooterCol title="Engage">
                <FooterLink href="/start-project">Start a project</FooterLink>
                <FooterLink href="/book">Book a call</FooterLink>
                <FooterLink href="/contact">Contact</FooterLink>
                <FooterLink href="/announcements">Announcements</FooterLink>
              </FooterCol>

              <FooterCol title="Legal">
                <FooterLink href="/privacy">Privacy policy</FooterLink>
                <FooterLink href="/terms">Terms of service</FooterLink>
                <FooterLink href="/brief/guide">Brief guide</FooterLink>
              </FooterCol>

              <FooterCol title="Studio">
                <span className="text-[13px] text-ink-2 leading-relaxed">
                  Spintex Flower Port
                  <br />
                  Accra, Ghana
                </span>
                <a
                  href="mailto:ephraim@aetechdigitalhub.com"
                  className="text-[13px] text-ink-2 hover:text-brand transition-colors break-all"
                >
                  ephraim@aetechdigitalhub.com
                </a>
                <a
                  href="tel:+233554448061"
                  className="text-[13px] text-ink-2 hover:text-brand transition-colors"
                >
                  +233 55 444 8061
                </a>
              </FooterCol>
            </div>
          </div>

          {/* META row */}
          <div className="flex flex-wrap justify-between items-center gap-4 py-6 border-t border-rule text-[12px] text-ink-3">
            <div className="flex flex-wrap items-center gap-3">
              <span>© {year} aeTech Digital Hub. All rights reserved.</span>
              <span className="hidden sm:inline opacity-40">·</span>
              <Link
                href="/privacy"
                className="hover:text-ink transition-colors"
              >
                Privacy
              </Link>
              <span className="opacity-40">·</span>
              <Link href="/terms" className="hover:text-ink transition-colors">
                Terms
              </Link>
            </div>
            <span className="font-mono">…You dream, We build.</span>
          </div>
        </div>

        {/* BIG STROKED WORDMARK */}
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl h-full max-h-64 rounded-full pointer-events-none"
            style={{
              background: "rgba(45, 13, 80, 0.06)",
              filter: "blur(100px)",
            }}
          />
          <h2
            aria-hidden
            className="text-center font-medium leading-[0.7] text-transparent select-none mt-6"
            style={{
              fontSize: "clamp(3rem, 15vw, 15rem)",
              WebkitTextStroke: "1px var(--rule)",
              letterSpacing: "-0.04em",
            }}
          >
            aeTech
          </h2>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-ink mb-4">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-[13px] text-ink-2 hover:text-brand transition-colors w-fit"
    >
      {children}
    </Link>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-ink-2 hover:text-brand transition-colors"
    >
      {children}
    </a>
  );
}
