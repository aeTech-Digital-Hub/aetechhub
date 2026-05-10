"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/services", label: "Services" },
  { href: "/projects", label: "Work" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200 bg-white",
        scrolled ? "border-b border-rule" : "border-b border-transparent",
      )}
    >
      <div className="container-px h-[60px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/aetech-logo.png"
            alt="aeTech"
            width={28}
            height={28}
            priority
            className="w-7 h-7 object-contain"
            style={{ height: "auto" }}
          />
          <span className="font-medium text-[15px] tracking-tight">aeTech</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[14px] text-ink-2 hover:text-ink transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Link
            href="/login"
            className="text-[14px] text-ink-2 hover:text-ink transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/start-project"
            className="btn-primary !py-1.5 !px-3.5 !text-[13px] !rounded-md"
          >
            Start a project
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 -mr-2"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-rule bg-white">
          <div className="container-px py-5 flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-[15px] text-ink-2 hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3 border-t border-rule mt-1">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn-ghost flex-1 justify-center !py-2 !text-[13px]"
              >
                Sign in
              </Link>
              <Link
                href="/start-project"
                onClick={() => setOpen(false)}
                className="btn-primary flex-1 justify-center !py-2 !text-[13px]"
              >
                Start a project
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
