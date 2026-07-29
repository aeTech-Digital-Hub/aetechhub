import { notFound, redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Project } from "@/models/Project";
import { getCurrentUser } from "@/lib/auth-server";
import {
  ProjectEditor,
  type ProjectData,
} from "@/components/admin/ProjectEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit project",
  robots: { index: false, follow: false },
};

async function getItem(id: string): Promise<ProjectData | null> {
  try {
    await dbConnect();
    const item: any = await Project.findById(id).lean();
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  } catch (err) {
    console.error("[admin/projects/edit] fetch failed:", err);
    return null;
  }
}

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/sign-in?next=/admin/projects");

  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  return <ProjectEditor initial={item} mode="edit" />;
}
