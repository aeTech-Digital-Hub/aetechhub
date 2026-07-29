import { notFound, redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Research } from "@/models";
import { getCurrentUser } from "@/lib/auth-server";
import {
  ResearchEditor,
  type ResearchData,
} from "@/components/admin/ResearchEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit article",
  robots: { index: false, follow: false },
};

async function getItem(id: string): Promise<ResearchData | null> {
  try {
    await dbConnect();
    const item: any = await Research.findById(id).lean();
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  } catch (err) {
    console.error("[admin/research/edit] fetch failed:", err);
    return null;
  }
}

export default async function EditResearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/sign-in?next=/admin/research");

  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return <ResearchEditor initial={item} mode="edit" />;
}
