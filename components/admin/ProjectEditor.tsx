"use client";
import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Save,
  Trash2,
  Send,
  Eye,
  EyeOff,
  Star,
  StarOff,
  ArrowLeft,
  Loader2,
  Check,
  ExternalLink,
  Upload,
  X,
  Plus,
} from "lucide-react";

export type ProjectMetric = {
  label: string;
  value: string;
};

export type ProjectData = {
  _id?: string;
  slug: string;
  title: string;
  tagline?: string;
  summary?: string;

  // Engagement
  client?: string;
  year?: number;
  timeline?: string;
  engagementType?: "Fixed-fee" | "Retainer" | "Advisory" | "Studio" | "";
  discipline?: "Build" | "Data" | "Secure" | "";
  services?: string[];
  techStack?: string[];

  // Media
  cover?: string;
  gallery?: string[];

  // Case study body
  challenge?: string;
  approach?: string;
  outcome?: string;
  metrics?: ProjectMetric[];

  // Meta
  liveUrl?: string;
  featured?: boolean;
  published?: boolean;
  publishedAt?: string | Date;
  convertedFromBriefId?: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function ProjectEditor({
  initial,
  mode,
}: {
  initial: ProjectData;
  mode: "new" | "edit";
}) {
  const router = useRouter();
  const [data, setData] = useState<ProjectData>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  // Cover upload state
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  // Gallery upload state
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [galleryUploads, setGalleryUploads] = useState<
    { name: string; progress: number; error?: string }[]
  >([]);

  // Tag drafts
  const [serviceDraft, setServiceDraft] = useState("");
  const [techDraft, setTechDraft] = useState("");

  const suggestedSlug = useMemo(() => slugify(data.title || ""), [data.title]);
  const effectiveSlug = slugTouched ? data.slug : suggestedSlug;

  function set<K extends keyof ProjectData>(key: K, value: ProjectData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  // ─── Save / delete ────────────────────────────────
  async function save(publishOverride?: boolean) {
    if (!data.title?.trim()) {
      setMsg("Title is required.");
      return;
    }
    if (!effectiveSlug) {
      setMsg("Slug is required.");
      return;
    }

    setBusy(true);
    setMsg("");

    const payload = {
      ...data,
      slug: effectiveSlug,
      ...(publishOverride !== undefined ? { published: publishOverride } : {}),
    };

    try {
      const url =
        mode === "edit"
          ? `/api/admin/projects/${data._id}`
          : "/api/admin/projects";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.ok) {
        setMsg(json.error || "Save failed.");
        return;
      }

      setMsg("Saved ✓");
      if (mode === "new" && json.item?._id) {
        router.push(`/admin/projects/${json.item._id}`);
      } else {
        setData((prev) => ({ ...prev, ...json.item }));
      }
    } catch (err: any) {
      setMsg(err?.message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (mode === "new" || !data._id) return;
    const ok = window.confirm(`Delete "${data.title}"? This cannot be undone.`);
    if (!ok) return;

    setBusy(true);
    setMsg("");

    try {
      const res = await fetch(`/api/admin/projects/${data._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Delete failed.");
        return;
      }
      router.push("/admin/projects");
    } catch (err: any) {
      setMsg(err?.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  // ─── Cover upload ─────────────────────────────────
  function openCoverPicker() {
    setCoverError(null);
    coverInputRef.current?.click();
  }

  async function handleCoverSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setCoverError(
        `File too large. Max 10 MB. Yours: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      );
      return;
    }
    if (!file.type.startsWith("image/")) {
      setCoverError("Please choose an image file.");
      return;
    }

    setCoverUploading(true);
    setCoverProgress(0);
    setCoverError(null);

    try {
      const form = new FormData();
      form.append("file", file);
      const url = await uploadWithProgress(form, (pct) =>
        setCoverProgress(pct),
      );
      set("cover", url);
      setCoverProgress(100);
      setTimeout(() => setCoverProgress(null), 800);
    } catch (err: any) {
      setCoverError(err?.message || "Upload failed.");
      setCoverProgress(null);
    } finally {
      setCoverUploading(false);
    }
  }

  // ─── Gallery upload (multiple, parallel) ──────────
  function openGalleryPicker() {
    galleryInputRef.current?.click();
  }

  async function handleGallerySelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const initialState = files.map((f) => ({ name: f.name, progress: 0 }));
    setGalleryUploads(initialState);

    const uploadedUrls: string[] = [];
    await Promise.all(
      files.map(async (file, idx) => {
        if (file.size > 10 * 1024 * 1024) {
          setGalleryUploads((prev) =>
            prev.map((s, i) =>
              i === idx ? { ...s, error: "Too large (max 10 MB)" } : s,
            ),
          );
          return;
        }
        if (!file.type.startsWith("image/")) {
          setGalleryUploads((prev) =>
            prev.map((s, i) =>
              i === idx ? { ...s, error: "Not an image" } : s,
            ),
          );
          return;
        }

        try {
          const form = new FormData();
          form.append("file", file);
          const url = await uploadWithProgress(form, (pct) => {
            setGalleryUploads((prev) =>
              prev.map((s, i) => (i === idx ? { ...s, progress: pct } : s)),
            );
          });
          uploadedUrls.push(url);
        } catch (err: any) {
          setGalleryUploads((prev) =>
            prev.map((s, i) =>
              i === idx ? { ...s, error: err?.message || "Upload failed" } : s,
            ),
          );
        }
      }),
    );

    if (uploadedUrls.length > 0) {
      set("gallery", [...(data.gallery || []), ...uploadedUrls]);
    }
    setTimeout(() => setGalleryUploads([]), 1500);
  }

  function removeGalleryItem(idx: number) {
    const next = [...(data.gallery || [])];
    next.splice(idx, 1);
    set("gallery", next);
  }

  function moveGalleryItem(idx: number, dir: -1 | 1) {
    const next = [...(data.gallery || [])];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    set("gallery", next);
  }

  // ─── Services + tech tags ─────────────────────────
  function addTag(
    kind: "services" | "techStack",
    draftSetter: (s: string) => void,
    value: string,
  ) {
    const v = value.trim();
    if (!v) return;
    const current = data[kind] || [];
    if (current.includes(v)) {
      draftSetter("");
      return;
    }
    set(kind, [...current, v]);
    draftSetter("");
  }

  function removeTag(kind: "services" | "techStack", t: string) {
    set(
      kind,
      (data[kind] || []).filter((x) => x !== t),
    );
  }

  // ─── Metrics (label + value pairs) ────────────────
  function addMetric() {
    set("metrics", [...(data.metrics || []), { label: "", value: "" }]);
  }

  function updateMetric(idx: number, field: "label" | "value", v: string) {
    const next = [...(data.metrics || [])];
    next[idx] = { ...next[idx], [field]: v };
    set("metrics", next);
  }

  function removeMetric(idx: number) {
    const next = [...(data.metrics || [])];
    next.splice(idx, 1);
    set("metrics", next);
  }

  const isPublished = !!data.published;
  const isFeatured = !!data.featured;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink transition-colors mr-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          All projects
        </Link>

        {mode === "edit" && (
          <>
            <button
              onClick={() => set("featured", !isFeatured)}
              disabled={busy}
              className="btn-ghost !py-2 !text-xs"
              title={isFeatured ? "Unfeature" : "Feature"}
            >
              {isFeatured ? (
                <>
                  <StarOff className="w-3.5 h-3.5" strokeWidth={2} /> Unfeature
                </>
              ) : (
                <>
                  <Star className="w-3.5 h-3.5" strokeWidth={2} /> Feature
                </>
              )}
            </button>

            {isPublished ? (
              <button
                onClick={() => save(false)}
                disabled={busy}
                className="btn-ghost !py-2 !text-xs"
                title="Unpublish"
              >
                <EyeOff className="w-3.5 h-3.5" strokeWidth={2} /> Unpublish
              </button>
            ) : (
              <button
                onClick={() => save(true)}
                disabled={busy}
                className="btn-primary !py-2 !text-xs"
                title="Publish"
                style={{ background: "var(--brand)" }}
              >
                <Send className="w-3.5 h-3.5" strokeWidth={2} /> Publish
              </button>
            )}

            {isPublished && data.slug && (
              <a
                href={`/projects/${effectiveSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost !py-2 !text-xs"
                title="View public page"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} /> View
              </a>
            )}

            <button
              onClick={remove}
              disabled={busy}
              className="btn-ghost !py-2 !text-xs text-red-600 hover:text-red-700"
              title="Delete permanently"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} /> Delete
            </button>
          </>
        )}

        <button
          onClick={() => save()}
          disabled={busy}
          className="btn-primary !py-2 !text-xs"
        >
          {busy ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />{" "}
              Saving…
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" strokeWidth={2} /> Save
            </>
          )}
        </button>
      </div>

      {msg && (
        <div
          className="text-[12.5px] mb-4 px-3 py-2 rounded-md inline-flex items-center gap-1.5"
          style={{
            background: msg === "Saved ✓" ? "#DCFCE7" : "#FEE2E2",
            color: msg === "Saved ✓" ? "#15803D" : "#B91C1C",
          }}
        >
          {msg === "Saved ✓" && <Check className="w-3 h-3" strokeWidth={2.5} />}
          {msg}
        </div>
      )}

      {/* Status pills */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <span
          className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded"
          style={{
            background: isPublished ? "#DCFCE7" : "var(--rule)",
            color: isPublished ? "#15803D" : "var(--ink-2)",
          }}
        >
          {isPublished ? "Published" : "Draft"}
        </span>
        {isFeatured && (
          <span
            className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded inline-flex items-center gap-1"
            style={{ background: "var(--brand-100)", color: "var(--brand)" }}
          >
            <Star className="w-2.5 h-2.5" strokeWidth={2} /> Featured
          </span>
        )}
        {data.publishedAt && isPublished && (
          <span className="text-[11px] font-mono text-ink-3">
            Published{" "}
            {new Date(data.publishedAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
        {data.convertedFromBriefId && (
          <span className="text-[10.5px] font-mono text-ink-3">
            From brief: {String(data.convertedFromBriefId).slice(-8)}
          </span>
        )}
      </div>

      <div className="space-y-5">
        {/* ─── Content ─── */}
        <FieldSection title="Content">
          <Field
            label="Title"
            value={data.title}
            onChange={(v) => set("title", v)}
            placeholder="Project name — punchy and distinctive"
          />
          <Field
            label="Slug"
            value={effectiveSlug}
            onChange={(v) => {
              setSlugTouched(true);
              set("slug", v);
            }}
            placeholder="url-friendly-slug"
            hint={
              slugTouched
                ? "Manually edited. Clear to regenerate from title."
                : "Auto-generated from title. Edit to override."
            }
            mono
          />
          <Field
            label="Tagline"
            value={data.tagline || ""}
            onChange={(v) => set("tagline", v)}
            placeholder="One line under the title. Short and specific."
          />
          <Field
            label="Summary"
            value={data.summary || ""}
            onChange={(v) => set("summary", v)}
            placeholder="One or two sentences shown on cards and social previews."
            multiline
            rows={2}
          />
        </FieldSection>

        {/* ─── Engagement details ─── */}
        <FieldSection title="Engagement details">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field
              label="Client"
              value={data.client || ""}
              onChange={(v) => set("client", v)}
              placeholder="e.g. Social Remit"
            />
            <Field
              label="Year"
              value={data.year ? String(data.year) : ""}
              onChange={(v) => {
                const n = parseInt(v, 10);
                set("year", Number.isFinite(n) ? n : undefined);
              }}
              placeholder="2025"
              mono
            />
            <Field
              label="Timeline"
              value={data.timeline || ""}
              onChange={(v) => set("timeline", v)}
              placeholder="8 weeks · Feb–Apr"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField
              label="Engagement type"
              value={data.engagementType || ""}
              onChange={(v) =>
                set("engagementType", v as ProjectData["engagementType"])
              }
              options={[
                { value: "", label: "—" },
                { value: "Fixed-fee", label: "Fixed-fee" },
                { value: "Retainer", label: "Retainer" },
                { value: "Advisory", label: "Advisory" },
                { value: "Studio", label: "Studio project" },
              ]}
            />
            <SelectField
              label="Discipline"
              value={data.discipline || ""}
              onChange={(v) =>
                set("discipline", v as ProjectData["discipline"])
              }
              options={[
                { value: "", label: "—" },
                { value: "Build", label: "Build" },
                { value: "Data", label: "Data" },
                { value: "Secure", label: "Secure" },
              ]}
            />
          </div>

          <Field
            label="Live URL"
            value={data.liveUrl || ""}
            onChange={(v) => set("liveUrl", v)}
            placeholder="https://client.com"
            mono
          />

          {/* Services tags */}
          <TagInput
            label="Services provided"
            hint="Which of our services applied to this project. Press Enter to add."
            values={data.services || []}
            draft={serviceDraft}
            setDraft={setServiceDraft}
            onAdd={() => addTag("services", setServiceDraft, serviceDraft)}
            onRemove={(t) => removeTag("services", t)}
            placeholder="e.g. Web & Product, SaaS, Machine Learning"
          />

          {/* Tech stack tags */}
          <TagInput
            label="Tech stack"
            hint="The tools and technologies used."
            values={data.techStack || []}
            draft={techDraft}
            setDraft={setTechDraft}
            onAdd={() => addTag("techStack", setTechDraft, techDraft)}
            onRemove={(t) => removeTag("techStack", t)}
            placeholder="e.g. Next.js, MongoDB, AWS"
          />
        </FieldSection>

        {/* ─── Cover ─── */}
        <FieldSection title="Cover image (optional)">
          <UrlWithClear
            label="Cover URL"
            value={data.cover || ""}
            onChange={(v) => set("cover", v)}
            placeholder="https://... or upload below"
          />

          <UploadButton
            uploading={coverUploading}
            progress={coverProgress}
            error={coverError}
            onClick={openCoverPicker}
            inputRef={coverInputRef}
            onFileSelected={handleCoverSelected}
            label="Load picture from your computer"
          />

          {data.cover && (
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden border border-rule bg-tint-1">
              <Image
                src={data.cover}
                alt="Cover preview"
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </FieldSection>

        {/* ─── Gallery ─── */}
        <FieldSection title="Gallery (optional)">
          <p className="text-[12px] text-ink-3">
            Additional images shown as a strip on the case study page. Reorder
            or remove after upload.
          </p>

          <div>
            <button
              type="button"
              onClick={openGalleryPicker}
              className="btn-ghost !py-2 !text-xs"
            >
              <Upload className="w-3.5 h-3.5" strokeWidth={2} />
              Add gallery images
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              multiple
              onChange={handleGallerySelected}
              className="hidden"
            />
          </div>

          {galleryUploads.length > 0 && (
            <div className="space-y-2">
              {galleryUploads.map((u, i) => (
                <div key={i} className="text-[12px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="truncate">{u.name}</span>
                    <span className="text-ink-3 font-mono">
                      {u.error ? "Error" : `${u.progress}%`}
                    </span>
                  </div>
                  <div className="h-1 bg-rule rounded overflow-hidden">
                    <div
                      className="h-full transition-all duration-200"
                      style={{
                        width: `${u.error ? 100 : u.progress}%`,
                        background: u.error ? "#B91C1C" : "var(--brand)",
                      }}
                    />
                  </div>
                  {u.error && (
                    <p className="text-[11px] text-red-700 mt-1">{u.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {(data.gallery || []).length > 0 && (
            <div className="grid sm:grid-cols-3 gap-3">
              {(data.gallery || []).map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative aspect-[4/3] rounded-lg overflow-hidden border border-rule bg-tint-1 group"
                >
                  <Image
                    src={url}
                    alt={`Gallery ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(i, -1)}
                      disabled={i === 0}
                      className="w-7 h-7 rounded-full bg-white/90 grid place-items-center disabled:opacity-40 text-[13px] font-mono"
                      title="Move left"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(i, 1)}
                      disabled={i === (data.gallery || []).length - 1}
                      className="w-7 h-7 rounded-full bg-white/90 grid place-items-center disabled:opacity-40 text-[13px] font-mono"
                      title="Move right"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(i)}
                      className="w-7 h-7 rounded-full bg-red-600 text-white grid place-items-center"
                      title="Remove"
                    >
                      <X className="w-3 h-3" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </FieldSection>

        {/* ─── Case study body ─── */}
        <FieldSection title="Case study">
          <Field
            label="Challenge"
            value={data.challenge || ""}
            onChange={(v) => set("challenge", v)}
            placeholder="What was the problem? Why did the client come to us?"
            multiline
            rows={5}
            mono
            hint="Supports lightweight markdown: ##, ###, -, and >. Blank line separates blocks."
          />
          <Field
            label="Approach"
            value={data.approach || ""}
            onChange={(v) => set("approach", v)}
            placeholder="How did we approach it? What did we build, and how?"
            multiline
            rows={7}
            mono
          />
          <Field
            label="Outcome"
            value={data.outcome || ""}
            onChange={(v) => set("outcome", v)}
            placeholder="What shipped, what changed for the client."
            multiline
            rows={5}
            mono
          />
        </FieldSection>

        {/* ─── Metrics ─── */}
        <FieldSection title="Metrics (optional)">
          <p className="text-[12px] text-ink-3">
            Measurable outcomes shown as callouts. Label + value pairs (e.g.
            &ldquo;Response time&rdquo; / &ldquo;-73%&rdquo;).
          </p>

          {(data.metrics || []).length > 0 && (
            <div className="space-y-2">
              {(data.metrics || []).map((m, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={m.label}
                    onChange={(e) => updateMetric(i, "label", e.target.value)}
                    placeholder="Label"
                    className="flex-1 px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3"
                  />
                  <input
                    type="text"
                    value={m.value}
                    onChange={(e) => updateMetric(i, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => removeMetric(i)}
                    className="btn-ghost !py-2 !px-3 text-red-600 hover:text-red-700"
                    title="Remove metric"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addMetric}
            className="btn-ghost !py-2 !text-xs"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Add metric
          </button>
        </FieldSection>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function uploadWithProgress(
  form: FormData,
  onProgress: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload/image");

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        onProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.ok) {
          resolve(json.url);
        } else {
          reject(new Error(json.error || `Upload failed (${xhr.status})`));
        }
      } catch {
        reject(new Error("Unexpected response from server."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(form);
  });
}

// ─────────────────────────────────────────
// FIELD PRIMITIVES
// ─────────────────────────────────────────

function FieldSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-rule bg-white rounded-xl p-5 space-y-4">
      <p className="eyebrow">{title}</p>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  multiline,
  rows = 3,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
}) {
  const inputClass = `w-full px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3 transition-colors ${
    mono ? "font-mono" : ""
  }`;

  return (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 block mb-1.5">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${inputClass} leading-relaxed resize-y`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      )}
      {hint && <p className="text-[10.5px] text-ink-3 mt-1">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 block mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TagInput({
  label,
  hint,
  values,
  draft,
  setDraft,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  hint?: string;
  values: string[];
  draft: string;
  setDraft: (s: string) => void;
  onAdd: () => void;
  onRemove: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 block mb-1.5">
        {label}
      </label>
      <div className="flex gap-2 flex-wrap mb-2">
        {values.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-tint-1 text-[12px] border border-rule"
          >
            {t}
            <button
              type="button"
              onClick={() => onRemove(t)}
              className="text-ink-3 hover:text-ink"
              title={`Remove ${t}`}
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </button>
          </span>
        ))}
        {values.length === 0 && (
          <span className="text-[12px] text-ink-3 italic">No tags yet</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder || "Add a tag (press Enter)"}
          className="flex-1 px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3"
        />
        <button
          type="button"
          onClick={onAdd}
          className="btn-ghost !py-2 !px-3"
          title="Add tag"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
      {hint && <p className="text-[10.5px] text-ink-3 mt-1">{hint}</p>}
    </div>
  );
}

function UrlWithClear({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 block mb-1.5">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="btn-ghost !py-2 !px-3"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

function UploadButton({
  uploading,
  progress,
  error,
  onClick,
  inputRef,
  onFileSelected,
  label,
}: {
  uploading: boolean;
  progress: number | null;
  error: string | null;
  onClick: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={uploading}
        className="btn-ghost !py-2 !text-xs"
      >
        {uploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
            Uploading {progress !== null ? `${progress}%` : "…"}
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" strokeWidth={2} />
            {label}
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={onFileSelected}
        className="hidden"
      />
      {progress !== null && (
        <div className="mt-2 h-1 bg-rule rounded overflow-hidden">
          <div
            className="h-full transition-all duration-200"
            style={{ width: `${progress}%`, background: "var(--brand)" }}
          />
        </div>
      )}
      {error && (
        <p className="text-[12px] text-red-700 bg-red-50 px-3 py-2 rounded-md mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
