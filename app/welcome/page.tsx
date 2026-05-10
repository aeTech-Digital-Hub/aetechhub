import { WelcomeFlow } from "@/components/welcome/WelcomeFlow";

// Tell crawlers this route is the entry experience, not content
export const metadata = {
  title: "Welcome",
  robots: { index: false, follow: true },
};

export default function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  // Note: server component reading searchParams just to forward a default redirect.
  // The flow itself runs on the client.
  return <WelcomeFlow />;
}
