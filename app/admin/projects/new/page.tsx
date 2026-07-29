import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { ProjectEditor } from "@/components/admin/ProjectEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New project",
  robots: { index: false, follow: false },
};

export default async function NewProjectPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    redirect("/sign-in?next=/admin/projects/new");

  return (
    <ProjectEditor
      initial={{
        // Required
        title: "",
        slug: "",

        // Content
        tagline: "",
        summary: "",

        // Engagement
        client: "",
        year: undefined,
        timeline: "",
        engagementType: "",
        discipline: "",
        services: [],
        techStack: [],
        liveUrl: "",

        // Media
        cover: "",
        gallery: [],

        // Case study
        challenge: "",
        approach: "",
        outcome: "",
        metrics: [],

        // Meta
        featured: false,
        published: false,
      }}
      mode="new"
    />
  );
}
