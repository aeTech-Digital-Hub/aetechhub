"use client";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { AnnouncementBar } from "@/components/marketing/AnnouncementBar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { WelcomeGate } from "@/components/welcome/WelcomeGate";

/**
 * Wraps the persistent site chrome (announcement bar, nav, footer, chat widget).
 * Hides everything on the welcome route so the cinematic intro is full-screen.
 *
 * Renders WelcomeGate inside, which handles first-visit redirection from `/`.
 */
export function ChromeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWelcome = pathname === "/welcome";
  const isAdmin = pathname.startsWith('/admin')

  if (isWelcome) {
    // No chrome — just the welcome content, which uses the full viewport
    return <>{children}</>;
  }

  return (
    <>
      <WelcomeGate />
      <AnnouncementBar />
     { !isAdmin && <Nav />}
      <main>{children}</main>
      {!isAdmin && <Footer />}
      <ChatWidget />
    </>
  );
}
