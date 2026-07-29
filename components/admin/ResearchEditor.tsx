"use client";
import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Save,
  Trash2,
  Send,
  EyeOff,
  ArrowLeft,
  Loader2,
  Check,
  ExternalLink,
  Upload,
  X,
  Plus,
} from "lucide-react";

export type ResearchData = {
  _id?: string;
  title: string;
  slug: string;
  category?: string;
  excerpt?: string;
  body?: string;
  cover?: string;
  gallery?: string[];
  author?: string;
  tags?: string[];
  readTime?: number;
  published?: boolean;
  publishedAt?: string | Date;
};

const CATEGORY_OPTIONS = [
  { value: "research", label: "Research" },
  { value: "engineering", label: "Software Engineering" },
  { value: "design", label: "Design" },
  { value: "business", label: "Business" },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Estimate reading time — ~230 wpm, minimum 1. */
function estimateReadTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

/** Shared XHR upload helper — Cloudinary endpoint from /api/admin/upload/image */
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

export function ResearchEditor({
  initial,
  mode,
}: {
  initial: ResearchData;
  mode: "new" | "edit";
}) {
  const router = useRouter();
  const [data, setData] = useState<ResearchData>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [galleryUploads, setGalleryUploads] = useState<
    { name: string; progress: number; error?: string }[]
  >([]);

  const [tagDraft, setTagDraft] = useState("");

  const suggestedSlug = useMemo(() => slugify(data.title || ""), [data.title]);
  const effectiveSlug = slugTouched ? data.slug : suggestedSlug;

  function set<K extends keyof ResearchData>(key: K, value: ResearchData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

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
      // Auto-fill readTime if empty
      readTime:
        data.readTime && data.readTime > 0
          ? data.readTime
          : estimateReadTime(data.body || ""),
      ...(publishOverride !== undefined ? { published: publishOverride } : {}),
    };

    try {
      const url =
        mode === "edit"
          ? `/api/admin/research/${data._id}`
          : "/api/admin/research";
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
        router.push(`/admin/research/${json.item._id}`);
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
      const res = await fetch(`/api/admin/research/${data._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Delete failed.");
        return;
      }
      router.push("/admin/research");
    } catch (err: any) {
      setMsg(err?.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

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

  function addTag() {
    const v = tagDraft.trim().replace(/^#/, "");
    if (!v) return;
    const current = data.tags || [];
    if (current.includes(v)) {
      setTagDraft("");
      return;
    }
    set("tags", [...current, v]);
    setTagDraft("");
  }

  function removeTag(t: string) {
    set(
      "tags",
      (data.tags || []).filter((x) => x !== t),
    );
  }

  const isPublished = !!data.published;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link
          href="/admin/research"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink transition-colors mr-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          All articles
        </Link>

        {mode === "edit" && (
          <>
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
                href={`/research/${effectiveSlug}`}
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
      </div>

      <div className="space-y-5">
        {/* CONTENT */}
        <FieldSection title="Content">
          <Field
            label="Title"
            value={data.title}
            onChange={(v) => set("title", v)}
            placeholder="A clear, honest title"
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
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectField
              label="Category"
              value={data.category || ""}
              onChange={(v) => set("category", v)}
              options={[{ value: "", label: "—" }, ...CATEGORY_OPTIONS]}
            />
            <Field
              label="Author"
              value={data.author || ""}
              onChange={(v) => set("author", v)}
              placeholder="Who wrote it?"
            />
          </div>
          <Field
            label="Excerpt"
            value={data.excerpt || ""}
            onChange={(v) => set("excerpt", v)}
            placeholder="One or two sentences shown in lists, social previews, and as the lead paragraph."
            multiline
            rows={2}
          />
        </FieldSection>

        {/* BODY */}
        <FieldSection title="Body">
          <Field
            label="Content"
            value={data.body || ""}
            onChange={(v) => set("body", v)}
            placeholder={`Write in plain paragraphs. For structure:

## Section heading
### Subheading
- Bullet point
> Quote or highlight`}
            multiline
            rows={20}
            mono
            hint="Supports lightweight markdown: ##, ###, -, and >. Blank line separates blocks."
          />

          <Field
            label="Read time (min)"
            value={data.readTime ? String(data.readTime) : ""}
            onChange={(v) => {
              const n = parseInt(v, 10);
              set("readTime", Number.isFinite(n) ? n : undefined);
            }}
            placeholder={`Auto-estimated on save: ~${estimateReadTime(data.body || "")} min`}
            mono
            hint="Leave blank to auto-calculate from body length (~230 wpm)."
          />
        </FieldSection>

        {/* COVER */}
        <FieldSection title="Cover image (optional)">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 block mb-1.5">
              Cover URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={data.cover || ""}
                onChange={(e) => set("cover", e.target.value)}
                placeholder="https://... or upload below"
                className="flex-1 px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3"
              />
              {data.cover && (
                <button
                  type="button"
                  onClick={() => set("cover", "")}
                  className="btn-ghost !py-2 !px-3"
                  title="Clear cover"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={openCoverPicker}
              disabled={coverUploading}
              className="btn-ghost !py-2 !text-xs"
            >
              {coverUploading ? (
                <>
                  <Loader2
                    className="w-3.5 h-3.5 animate-spin"
                    strokeWidth={2}
                  />
                  Uploading {coverProgress !== null ? `${coverProgress}%` : "…"}
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" strokeWidth={2} />
                  Load picture from your computer
                </>
              )}
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleCoverSelected}
              className="hidden"
            />
            {coverProgress !== null && (
              <div className="mt-2 h-1 bg-rule rounded overflow-hidden">
                <div
                  className="h-full transition-all duration-200"
                  style={{
                    width: `${coverProgress}%`,
                    background: "var(--brand)",
                  }}
                />
              </div>
            )}
            {coverError && (
              <p className="text-[12px] text-red-700 bg-red-50 px-3 py-2 rounded-md mt-2">
                {coverError}
              </p>
            )}
          </div>

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

        {/* GALLERY */}
        <FieldSection title="Figures (optional)">
          <p className="text-[12px] text-ink-3">
            Additional images shown as a grid after the article body. Reorder or
            remove after upload.
          </p>

          <div>
            <button
              type="button"
              onClick={openGalleryPicker}
              className="btn-ghost !py-2 !text-xs"
            >
              <Upload className="w-3.5 h-3.5" strokeWidth={2} />
              Add figures
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
                    alt={`Figure ${i + 1}`}
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

        {/* TAGS */}
        <FieldSection title="Tags (optional)">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-ink-3 block mb-1.5">
              Tags
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {(data.tags || []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-tint-1 text-[12px] border border-rule"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-ink-3 hover:text-ink"
                    title={`Remove ${t}`}
                  >
                    <X className="w-3 h-3" strokeWidth={2} />
                  </button>
                </span>
              ))}
              {(data.tags || []).length === 0 && (
                <span className="text-[12px] text-ink-3 italic">
                  No tags yet
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag (press Enter)"
                className="flex-1 px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3"
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-ghost !py-2 !px-3"
                title="Add tag"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </FieldSection>
      </div>
    </div>
  );
}

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
