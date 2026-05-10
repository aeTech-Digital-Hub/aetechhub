"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser, clearError } from "@/store/slices/authSlice";
import { pushToast } from "@/store/slices/uiSlice";

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInShell />}>
      <SignInExperience />
    </Suspense>
  );
}

function SignInShell() {
  return (
    <section className="min-h-[80vh] grid place-items-center container-px py-20 bg-base">
      <div className="w-full max-w-md rounded-2xl border border-rule bg-white p-8 lg:p-10">
        <div className="space-y-4">
          <div className="h-9 w-44 rounded bg-rule animate-pulse" />
          <div className="h-12 w-full rounded bg-rule animate-pulse" />
          <div className="h-12 w-full rounded bg-rule animate-pulse" />
          <div className="h-11 w-full rounded bg-rule animate-pulse" />
        </div>
      </div>
    </section>
  );
}

type Mode = "sign-in" | "sign-up";

function SignInExperience() {
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const {
    loading: signingIn,
    error: signInError,
    user,
  } = useAppSelector((s) => s.auth);

  const next = safeNext(params.get("next"));
  const oauthError = params.get("error");

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [signupBusy, setSignupBusy] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // Already signed in? Send them where they wanted to go
  useEffect(() => {
    if (user) {
      const dest = user.role === "admin" ? "/admin/dashboard" : next;
      router.replace(dest);
    }
  }, [user, next, router]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch, mode]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const res = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(res)) {
      dispatch(
        pushToast(
          `Welcome back${res.payload.name ? `, ${res.payload.name.split(" ")[0]}` : ""}`,
          "success",
        ),
      );
      const dest = res.payload.role === "admin" ? "/admin/dashboard" : next;
      router.push(dest);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setSignupError(null);
    if (!consent) {
      setSignupError("Please accept the terms to continue.");
      return;
    }
    setSignupBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, consent }),
      });
      const json = await res.json();
      if (!json.ok) {
        // If account exists, switch them to sign-in mode
        if (json.code === "email-exists") {
          setMode("sign-in");
          setSignupError(null);
          dispatch(
            pushToast(
              "An account with this email exists. Sign in instead.",
              "info",
            ),
          );
          return;
        }
        throw new Error(json.error || "Could not create account.");
      }
      dispatch(
        pushToast(`Welcome, ${json.user.name.split(" ")[0]}`, "success"),
      );
      router.push(next);
    } catch (err: any) {
      setSignupError(err?.message || "Could not create account.");
    } finally {
      setSignupBusy(false);
    }
  }

  function startGoogleSignIn() {
    // Server-side redirect; we just point the browser at the start endpoint
    const url = `/api/auth/google/start?next=${encodeURIComponent(next)}`;
    window.location.href = url;
  }

  const isSignIn = mode === "sign-in";

  return (
    <section className="min-h-[80vh] grid place-items-center container-px py-20 bg-base">
      <div className="w-full max-w-md rounded-2xl border border-rule bg-white p-8 lg:p-10">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
          <Image
            src="/aetech-logo.png"
            alt="aeTech Digital Hub"
            width={32}
            height={32}
            priority
            className="w-8 h-8 object-contain"
            style={{ height: "auto" }}
          />
          <span className="h-display text-[18px] tracking-tight">
            ae<span className="italic font-light">Tech</span>
          </span>
        </Link>

        <h1 className="h-display text-[28px] lg:text-[32px] tracking-tighter mb-2">
          {isSignIn ? "Sign in." : "Create your account."}
        </h1>
        <p className="text-[14px] text-ink-2 mb-8 leading-relaxed">
          {isSignIn
            ? "Welcome back. Sign in to continue."
            : "A free account lets you save your brief, track invoices, and pick up where you left off."}
        </p>

        {/* Google button — top, primary alternative */}
        <button
          onClick={startGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-rule bg-white hover:border-ink-3 transition-colors text-[14px] font-medium mb-5"
          type="button"
        >
          <GoogleGlyph />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-5 text-[11px] font-mono uppercase tracking-wider text-ink-3">
          <span className="flex-1 h-px bg-rule" />
          or with email
          <span className="flex-1 h-px bg-rule" />
        </div>

        {oauthError && (
          <p className="text-[13px] text-red-700 bg-red-50 rounded-md px-3 py-2 mb-4">
            Google sign-in failed. Try email instead, or contact support.
          </p>
        )}

        {isSignIn ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
            />
            {signInError && (
              <p className="text-[13px] text-red-700 bg-red-50 rounded-md px-3 py-2">
                {signInError}
              </p>
            )}
            <button
              disabled={signingIn || !email || !password}
              className="btn-primary w-full justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {signingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <Field
              label="Your name"
              type="text"
              value={name}
              onChange={setName}
              autoComplete="name"
              required
            />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              required
              hint="At least 8 characters."
            />
            <label className="flex items-start gap-2.5 text-[12.5px] text-ink-2 cursor-pointer leading-snug">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 flex-shrink-0"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" className="link-brand">
                  terms
                </Link>{" "}
                and the{" "}
                <Link href="/privacy" className="link-brand">
                  privacy notice
                </Link>
                . You can unsubscribe and delete your account anytime.
              </span>
            </label>
            {signupError && (
              <p className="text-[13px] text-red-700 bg-red-50 rounded-md px-3 py-2">
                {signupError}
              </p>
            )}
            <button
              type="submit"
              disabled={signupBusy || !email || !password || !name || !consent}
              className="btn-primary w-full justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {signupBusy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Mode switcher */}
        <p className="text-[13px] text-ink-2 mt-6 text-center">
          {isSignIn ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setMode("sign-up")}
                className="link-brand"
                type="button"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("sign-in")}
                className="link-brand"
                type="button"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function safeNext(input: string | null): string {
  if (!input) return "/";
  // Reject absolute URLs / open-redirect attempts
  if (input.startsWith("//") || /^[a-z]+:/i.test(input)) return "/";
  if (!input.startsWith("/")) return "/";
  return input;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-[12px] font-medium text-ink-2 mb-1.5 block">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-4 py-2.5 rounded-lg border border-rule bg-white text-[14px] focus:outline-none focus:border-ink-3 transition-colors"
      />
      {hint && <p className="text-[11.5px] text-ink-3 mt-1">{hint}</p>}
    </div>
  );
}

/** Authentic Google "G" mark — using their brand colors */
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.583-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.165 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
