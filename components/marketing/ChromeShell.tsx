"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { AnnouncementBar } from "@/components/marketing/AnnouncementBar";
import { WelcomeGate } from "@/components/welcome/WelcomeGate";

// Lazy-load the chat widget so it doesn't ship in the initial bundle.
// The widget only mounts after the rest of the page is interactive,
// which improves LCP / TTI without changing UX (chat doesn't need to
// be available in the first 100ms anyway).
const ChatWidget = dynamic(
  () => import("@/components/chat/ChatWidget").then((m) => m.ChatWidget),
  { ssr: false },
);

/**
 * Wraps the persistent site chrome (announcement bar, nav, footer, chat widget).
 * Hides everything on the welcome route so the cinematic intro is full-screen.
 */
export function ChromeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWelcome = pathname === "/welcome";
  const isAdmin = pathname.startsWith('/admin')

  if (isWelcome) {
    return <>{children}</>;
  }

  return (
    <>
      <WelcomeGate />
      <AnnouncementBar />
      {!isAdmin && <Nav />}
      <main>{children}</main>
      {!isAdmin && <Footer />}
      <ChatWidget />
    </>
  );
}
