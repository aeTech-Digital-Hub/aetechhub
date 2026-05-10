"use client";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { BriefGate, type GateContact } from "./BriefGate";
import { BriefEditor } from "./BriefEditor";
import { getOrCreateFingerprint } from "@/lib/fingerprint";
import type { StructuredBrief } from "@/lib/brief";
import { Loader2 } from "lucide-react";

type State =
  | { step: "loading" }
  | { step: "gate"; resumeContact?: Partial<GateContact> }
  | {
      step: "editor";
      briefId: string;
      contact: GateContact;
      initial: StructuredBrief;
    };

export function BriefExperience() {
  const [state, setState] = useState<State>({ step: "loading" });
  const [fingerprint, setFingerprint] = useState<string>("");

  // ── On mount: get fingerprint, ping anonymous visit, look for resumable draft ──
  useEffect(() => {
    const fp = getOrCreateFingerprint();
    setFingerprint(fp);

    // Fire-and-forget anonymous visit ping
    fetch("/api/briefs/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: fp, page: "gate" }),
    }).catch(() => {});

    // Look for a resumable draft tied to this fingerprint
    fetch(`/api/briefs/draft?fingerprint=${encodeURIComponent(fp)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok && json.brief) {
          // Found a draft — resume into the editor directly
          setState({
            step: "editor",
            briefId: json.brief.briefId,
            contact: {
              name: json.brief.name,
              email: json.brief.email,
              company: json.brief.company || "",
              phone: json.brief.phone || "",
            },
            initial: json.brief.structured,
          });
        } else {
          // No prior draft — show the gate
          setState({ step: "gate" });
        }
      })
      .catch(() => setState({ step: "gate" }));
  }, []);

  // ── Gate submission: create a draft, transition to editor ──
  async function handleGatePass(contact: GateContact) {
    const res = await fetch("/api/briefs/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fingerprint,
        contact,
        source: "brief-editor",
      }),
    });
    const json = await res.json();
    if (!json.ok) {
      throw new Error(json.error || "Could not start the brief.");
    }

    // Track that they passed the gate
    fetch("/api/briefs/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint, page: "editor" }),
    }).catch(() => {});

    setState({
      step: "editor",
      briefId: json.briefId,
      contact,
      initial: {
        aboutYou: "",
        problem: "",
        success: "",
        tried: "",
        constraints: "",
        risks: "",
        anythingElse: "",
      },
    });
  }

  if (state.step === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-ink-3" strokeWidth={2} />
      </div>
    );
  }

  if (state.step === "gate") {
    return (
      <Reveal>
        <BriefGate onPass={handleGatePass} initial={state.resumeContact} />
      </Reveal>
    );
  }

  return (
    <BriefEditor
      briefId={state.briefId}
      fingerprint={fingerprint}
      initial={state.initial}
      contactName={state.contact.name}
    />
  );
}
