"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser, clearError } from "@/store/slices/authSlice";
import { pushToast } from "@/store/slices/uiSlice";

/**
 * Outer page — pure shell + Suspense boundary.
 * Anything that calls useSearchParams() must live INSIDE the boundary,
 * otherwise Next.js bails out of static rendering for the whole route.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

/** Skeleton shown while the search-params-using form hydrates */
function LoginShell() {
  return (
    <section className="min-h-[80vh] grid place-items-center container-px py-20">
      <div className="w-full max-w-md border border-rule bg-bone p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded bg-rule animate-pulse" />
          <div className="h-7 w-24 rounded bg-rule animate-pulse" />
        </div>
        <div className="h-9 w-44 rounded bg-rule animate-pulse mt-6 mb-2" />
        <div className="h-4 w-56 rounded bg-rule animate-pulse mb-10" />
        <div className="space-y-6">
          <div className="h-12 w-full rounded bg-rule animate-pulse" />
          <div className="h-12 w-full rounded bg-rule animate-pulse" />
          <div className="h-11 w-full rounded bg-rule animate-pulse" />
        </div>
      </div>
    </section>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const { loading, error, user } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // If already logged in, send away from login page
  useEffect(() => {
    if (user) {
      const dest =
        params.get("callbackUrl") ||
        (user.role === "admin" ? "/admin/dashboard" : "/");
      router.replace(dest);
    }
  }, [user, params, router]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(res)) {
      dispatch(
        pushToast(
          `Welcome back${res.payload.name ? `, ${res.payload.name.split(" ")[0]}` : ""}`,
          "success",
        ),
      );
      const dest =
        params.get("callbackUrl") ||
        (res.payload.role === "admin" ? "/admin/dashboard" : "/");
      router.push(dest);
    }
  }

  return (
    <section className="min-h-[80vh] grid place-items-center container-px py-20">
      <div className="w-full max-w-md border border-rule bg-bone p-10">
        <Link href="/" className="flex items-center gap-3 mb-6">
          <Image
            src="/aetech-logo.png"
            alt="aeTech Digital Hub"
            width={48}
            height={48}
            priority
            className="w-12 h-12 object-contain"
            style={{ height: "auto" }}
          />
          <span className="font-display text-3xl tracking-tightest">
            ae<span className="italic font-light">Tech</span>
          </span>
        </Link>
        <h1 className="h-display text-4xl mb-2 mt-6">Admin sign in</h1>
        <p className="text-sm text-ink/60 mb-10">
          For studio team members only.
        </p>

        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="eyebrow text-ink/70 mb-2 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-b border-ink/20 bg-transparent py-3 focus:outline-none focus:border-purple-700"
            />
          </div>
          <div>
            <label className="eyebrow text-ink/70 mb-2 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border-b border-ink/20 bg-transparent py-3 focus:outline-none focus:border-purple-700"
            />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-30"
          >
            {loading ? "Signing in…" : "Sign in"}{" "}
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </form>
      </div>
    </section>
  );
}
