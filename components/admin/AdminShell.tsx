"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Megaphone,
  BookOpen,
  TrendingUp,
  MessageSquare,
  CalendarClock,
  LogOut,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { logoutUser } from "@/store/slices/authSlice";
import { pushToast } from "@/store/slices/uiSlice";

const NAV = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Briefs", icon: FileText },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/funnel", label: "Funnel", icon: TrendingUp },
  { href: "/admin/chat", label: "Chat", icon: MessageSquare },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarClock },
  { href: "/admin/broadcast", label: "Broadcast", icon: Send },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/research", label: "Research", icon: BookOpen },
];

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name?: string; email?: string; role?: string };
}) {
  const path = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  async function logout() {
    await dispatch(logoutUser());
    dispatch(pushToast("Signed out", "info"));
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-bone flex">
      <aside className="w-64 bg-ink text-bone flex flex-col fixed inset-y-0 left-0 z-30">
        <div className="px-6 py-6 border-b border-bone/10">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/aetech-logo-light.png"
              alt="aeTech Digital Hub"
              width={32}
              height={32}
              priority
              className="w-8 h-8 object-contain"
              style={{ height: "auto" }}
            />
            <span className="font-display text-xl text-bone">
              ae<span className="italic font-light">Tech</span>
            </span>
          </Link>
          <p className="text-[11px] uppercase tracking-wider text-accent mt-1.5">
            Studio Admin
          </p>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-bone/10 text-bone"
                    : "text-bone/60 hover:text-bone hover:bg-bone/5",
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-bone/10">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm text-bone truncate">
              {user.name || user.email}
            </p>
            <p className="text-[11px] text-bone/50 uppercase tracking-wider">
              {user.role}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-bone/60 hover:text-bone hover:bg-bone/5 w-full"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 lg:p-12 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
