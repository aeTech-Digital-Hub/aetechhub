"use client";
import { useRef, useState, ReactNode, MouseEvent } from "react";

/**
 * SpotlightCard — a subtle radial gradient that follows the user's cursor
 * across the card. Pure CSS via inline custom properties + mouse tracking.
 *
 * The Linear / Vercel "did I just see that?" trick — barely noticeable
 * but makes the card feel alive when hovered.
 *
 * IMPORTANT: children are rendered as direct children of the wrapper, so any
 * grid / flex layout passed via `className` works correctly. The spotlight
 * overlay is placed inside the wrapper as an absolute-positioned sibling
 * with `pointer-events: none`, so it does not interfere with the grid flow
 * (`position: absolute` removes it from the layout box-flow entirely).
 */
export function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(45, 13, 80, 0.15)",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  [key: string]: any;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [active, setActive] = useState(false);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      className={`relative ${className}`}
      {...rest}
    >
      {children}

      {/* Spotlight overlay — absolute so it doesn't break grid/flex flow.
          z-10 to sit above siblings but pointer-events-none so clicks pass through. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-300 z-10"
        style={{
          opacity: active ? 1 : 0,
          background: `radial-gradient(circle 320px at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 60%)`,
        }}
      />
    </div>
  );
}
