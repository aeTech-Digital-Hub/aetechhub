import { notFound, redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Announcement } from "@/models";
import { getCurrentUser } from "@/lib/auth-server";
import {
  AnnouncementEditor,
  type AnnouncementData,
} from "@/components/admin/AnnouncementEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit announcement",
  robots: { index: false, follow: false },
};

async function getItem(id: string): Promise<AnnouncementData | null> {
  try {
    await dbConnect();
    const item: any = await Announcement.findById(id).lean();
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  } catch (err) {
    console.error("[admin/announcements/edit] fetch failed:", err);
    return null;
  }
}

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    redirect("/sign-in?next=/admin/announcements");

  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return <AnnouncementEditor initial={item} mode="edit" />;
}
