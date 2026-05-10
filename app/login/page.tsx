import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next || params.callbackUrl || "/";
  redirect(`/sign-in?next=${encodeURIComponent(next)}`);
}
