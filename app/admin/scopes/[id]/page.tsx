import { notFound, redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Scope } from "@/models/Project";
import { getCurrentUser } from "@/lib/auth-server";
import { ScopeEditor, type ScopeData } from "@/components/admin/ScopeEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit scope",
  robots: { index: false, follow: false },
};

async function getItem(id: string): Promise<ScopeData | null> {
  try {
    await dbConnect();
    const item: any = await Scope.findById(id)
      .populate("briefId", "briefId name email")
      .populate("convertedToProjectId", "title slug")
      .lean();
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  } catch (err) {
    console.error("[admin/scopes/edit] fetch failed:", err);
    return null;
  }
}

export default async function EditScopePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/sign-in?next=/admin/scopes");

  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return <ScopeEditor initial={item} mode="edit" />;
}
