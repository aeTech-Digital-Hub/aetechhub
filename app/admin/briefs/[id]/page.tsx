import { notFound, redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Brief } from "@/models/Project";
import { getCurrentUser } from "@/lib/auth-server";
import { BriefManager, type BriefLean } from "@/components/admin/BriefManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Brief",
  robots: { index: false, follow: false },
};

async function getBrief(id: string): Promise<BriefLean | null> {
  try {
    await dbConnect();
    const item: any = await Brief.findById(id)
      .populate("convertedTo", "title slug")
      .lean();
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  } catch (err) {
    console.error("[admin/briefs/detail] fetch failed:", err);
    return null;
  }
}

export default async function AdminBriefDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/sign-in?next=/admin/briefs");

  const { id } = await params;
  const brief = await getBrief(id);
  if (!brief) notFound();

  return <BriefManager initial={brief} />;
}
