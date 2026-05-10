"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBriefs } from "@/store/slices/dashboardSlice";

const STATUSES = [
  "all",
  "new",
  "reviewing",
  "in-discussion",
  "quoted",
  "won",
  "lost",
  "archived",
];

export default function BriefsListPage() {
  const dispatch = useAppDispatch();
  const { briefs, loading } = useAppSelector((s) => ({
    briefs: s.dashboard.briefs,
    loading: s.dashboard.loading.briefs,
  }));
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    dispatch(fetchBriefs());
  }, [dispatch]);

  const filtered = briefs.filter((b: any) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (
      q &&
      !`${b.name} ${b.email} ${b.company || ""}`
        .toLowerCase()
        .includes(q.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-purple-700 mb-2">
            — Briefs
          </p>
          <h1 className="h-display text-4xl">Project requests</h1>
          <p className="text-sm text-ink/60 mt-2">
            {briefs.length} total ·{" "}
            {briefs.filter((b: any) => b.status === "new").length} new
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border border-rule bg-bone p-3">
        <div className="flex-1 flex items-center gap-2 px-3">
          <Search className="w-4 h-4 text-ink/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, company…"
            className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider ${filter === s ? "bg-ink text-bone" : "text-ink/60 hover:bg-rule"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-rule bg-bone overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-rule">
            <tr className="text-left">
              <Th>Client</Th>
              <Th>Project</Th>
              <Th>Budget</Th>
              <Th>Status</Th>
              <Th>Received</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {loading && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink/50">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink/50 italic">
                  No briefs match.
                </td>
              </tr>
            )}
            {filtered.map((b: any) => (
              <tr key={b._id} className="hover:bg-cream/50">
                <Td>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-ink/50">
                    {b.email}
                    {b.company ? ` · ${b.company}` : ""}
                  </div>
                </Td>
                <Td>
                  <div className="text-sm">{b.projectType || "—"}</div>
                  <div className="text-xs text-ink/50">
                    {(b.services || []).slice(0, 2).join(", ")}
                  </div>
                </Td>
                <Td className="text-xs">{b.budget || "—"}</Td>
                <Td>
                  <StatusPill s={b.status} />
                </Td>
                <Td className="text-xs text-ink/60">
                  {formatDate(b.createdAt)}
                </Td>
                <Td>
                  <Link
                    href={`/admin/projects/${b._id}`}
                    className="text-purple-700 hover:underline text-xs"
                  >
                    View →
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-ink/50 font-medium">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: any) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function StatusPill({ s }: { s: string }) {
  const colors: Record<string, string> = {
    new: "bg-purple-100 text-purple-800",
    reviewing: "bg-blue-100 text-blue-800",
    "in-discussion": "bg-yellow-100 text-yellow-800",
    quoted: "bg-amber-100 text-amber-800",
    won: "bg-green-100 text-green-800",
    lost: "bg-gray-100 text-gray-700",
    archived: "bg-gray-50 text-gray-500",
  };
  return (
    <span
      className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full ${colors[s] || "bg-gray-100"}`}
    >
      {s}
    </span>
  );
}
