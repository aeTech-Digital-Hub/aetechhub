import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Brief } from "@/models/Project";
import { getCurrentUser } from "@/lib/auth-server";
import { ScopeEditor } from "@/components/admin/ScopeEditor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "New scope",
  robots: { index: false, follow: false },
};

/**
 * Optional query param `?briefId=<id>` prefills from a Brief. The scope
 * itself isn't created here — it's created via POST /api/admin/scopes on
 * first save. This page just pre-populates the form UI.
 */
export default async function NewScopePage({
  searchParams,
}: {
  searchParams: Promise<{ briefId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin")
    redirect("/sign-in?next=/admin/scopes/new");

  const { briefId } = await searchParams;

  // Default blank state
  let initial = {
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    clientPhone: "",
    projectTitle: "",
    projectDescription: "",
    deliverables: [],
    discountUsd: 0,
    depositPercent: 50,
    timelineDescription: "",
    milestones: [],
    assumptions: "",
    exclusions: [],
    paymentTerms:
      "70% deposit before work begins, 30% on delivery. Invoices due 14 days from issue. See our Terms of Service for full commercial terms.",
    notes: "",
    status: "draft",
  };

  // Prefill from brief if briefId provided
  if (briefId) {
    try {
      await dbConnect();
      const brief: any = await Brief.findById(briefId).lean();
      if (brief) {
        initial = {
          ...initial,
          clientName: brief.name || "",
          clientEmail: brief.email || "",
          clientCompany: brief.company || "",
          clientPhone: brief.phone || "",
          projectTitle:
            brief.company?.trim() ||
            brief.projectType?.trim() ||
            `Project for ${brief.name || "client"}`,
          projectDescription: brief.summary || brief.structured?.problem || "",
          timelineDescription: brief.timeline || "",
          notes: `Prefilled from brief #${brief.briefId || briefId} on ${new Date().toLocaleDateString(
            "en-GB",
            { day: "2-digit", month: "short", year: "numeric" },
          )}.`,
          // We pass briefId through so the API endpoint creates the link
          // when the scope is first saved
        };
        // Include briefId as a hidden field for the API to consume on save
        (initial as any).briefId = briefId;
      }
    } catch (err) {
      console.error("[scopes/new] brief prefill failed:", err);
      // Don't block scope creation on prefill failure
    }
  }

  return <ScopeEditor initial={initial as any} mode="new" />;
}
