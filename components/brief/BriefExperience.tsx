"use client";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { BriefEditor } from "./BriefEditor";
import { getOrCreateFingerprint } from "@/lib/fingerprint";
import { EMPTY_BRIEF, type StructuredBrief } from "@/lib/brief";
import { Loader2 } from "lucide-react";

type AuthedUser = { name: string; email: string };

type State =
  | { step: "loading" }
  | { step: "starting" }
  | { step: "editor"; briefId: string; initial: StructuredBrief };

/**
 * Brief experience — for AUTHENTICATED users only.
 * The page-level component (`app/brief/page.tsx`) enforces auth before rendering.
 *
 * On mount:
 *   1. Check for an existing draft tied to this user (via fingerprint AND backed by
 *      their email on the server)
 *   2. If found → resume into the editor
 *   3. If not → create a fresh draft using the user's account info, drop into the editor
 */
export function BriefExperience({ authedUser }: { authedUser: AuthedUser }) {
  const [state, setState] = useState<State>({ step: "loading" });
  const [fingerprint, setFingerprint] = useState<string>("");

  useEffect(() => {
    const fp = getOrCreateFingerprint();
    setFingerprint(fp);

    // Anonymous visit ping is now redundant since we know who the user is,
    // but the editor-page ping is still useful for funnel metrics
    fetch("/api/briefs/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: fp, page: "editor" }),
    }).catch(() => {});

    // Look for a resumable draft
    fetch(`/api/briefs/draft?fingerprint=${encodeURIComponent(fp)}`)
      .then((r) => r.json())
      .then(async (json) => {
        if (json.ok && json.brief) {
          setState({
            step: "editor",
            briefId: json.brief.briefId,
            initial: json.brief.structured || EMPTY_BRIEF,
          });
          return;
        }

        // No draft — create one with the user's account info
        setState({ step: "starting" });
        const createRes = await fetch("/api/briefs/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fingerprint: fp,
            contact: { name: authedUser.name, email: authedUser.email },
            source: "brief-editor",
          }),
        });
        const created = await createRes.json();
        if (created.ok) {
          setState({
            step: "editor",
            briefId: created.briefId,
            initial: EMPTY_BRIEF,
          });
        } else {
          // Fallback to a soft error — show the loading state so the user can retry by reload
          console.error("[brief] could not create draft", created);
          setState({ step: "loading" });
        }
      })
      .catch((err) => {
        console.error("[brief]", err);
        setState({ step: "loading" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.step === "loading" || state.step === "starting") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-ink-3" strokeWidth={2} />
        <p className="text-[12.5px] text-ink-3">
          {state.step === "starting" ? "Setting up your brief…" : "Loading…"}
        </p>
      </div>
    );
  }

  return (
    <Reveal>
      <BriefEditor
        briefId={state.briefId}
        fingerprint={fingerprint}
        initial={state.initial}
        contactName={authedUser.name}
      />
    </Reveal>
  );
}
