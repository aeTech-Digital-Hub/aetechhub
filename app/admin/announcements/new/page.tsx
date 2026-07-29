import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { AnnouncementEditor } from "@/components/admin/AnnouncementEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New announcement",
  robots: { index: false, follow: false },
};

export default async function NewAnnouncementPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    redirect("/sign-in?next=/admin/announcements/new");

  return (
    <AnnouncementEditor
      initial={{
        title: "",
        slug: "",
        summary: "",
        body: "",
        cover: "",
        category: "",
        pinned: false,
        published: false,
      }}
      mode="new"
    />
  );
}
