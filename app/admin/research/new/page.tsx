import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { ResearchEditor } from "@/components/admin/ResearchEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New article",
  robots: { index: false, follow: false },
};

export default async function NewResearchPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    redirect("/sign-in?next=/admin/research/new");

  return (
    <ResearchEditor
      initial={{
        title: "",
        slug: "",
        category: "",
        excerpt: "",
        body: "",
        cover: "",
        gallery: [],
        author: "",
        tags: [],
        readTime: undefined,
        published: false,
      }}
      mode="new"
    />
  );
}
