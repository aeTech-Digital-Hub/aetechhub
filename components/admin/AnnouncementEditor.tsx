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
  Pin,
  PinOff,
  ArrowLeft,
  Loader2,
  Check,
  ExternalLink,
  Upload,
  X,
} from "lucide-react";

function BodyPreview({ text }: { text: string }) {
  if (!text.trim()) {
    return (
      <p className="text-[13px] text-ink-3 italic">
        Preview appears here as you type. Use{" "}
        <code className="text-[12px]">## heading</code>,{" "}
        <code className="text-[12px]">### subheading</code>,{" "}
        <code className="text-[12px]">- bullet</code>, or{" "}
        <code className="text-[12px]">&gt; quote</code>.
      </p>
    );
  }
  const blocks = text.split(/\n\n+/).filter((b) => b.trim());
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="h-display text-[20px] tracking-tighter mt-6">
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("### ")) {
          return (
            <h3 key={i} className="h-display text-[16px] tracking-tight mt-4">
              {block.slice(4)}
            </h3>
          );
        }
        if (/^[-*] /m.test(block)) {
          const items = block
            .split("\n")
            .filter((l) => /^[-*] /.test(l))
            .map((l) => l.replace(/^[-*] /, ""));
          return (
            <ul key={i} className="space-y-1.5">
              {items.map((it, j) => (
                <li
                  key={j}
                  className="flex gap-2 text-[13.5px] text-ink-2 leading-relaxed"
                >
                  <span
                    style={{ color: "var(--brand)" }}
                    className="font-bold flex-shrink-0"
                  >
                    ·
                  </span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-2 pl-3 py-0.5 italic text-[13.5px] text-ink-2"
              style={{ borderColor: "var(--brand)" }}
            >
              {block.slice(2)}
            </blockquote>
          );
        }
        return (
          <p key={i} className="text-[13.5px] text-ink-2 leading-relaxed">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export type AnnouncementData = {
  _id?: string;
  title: string;
  slug: string;
  summary?: string;
  body?: string;
  cover?: string;
  category?: string;
  pinned?: boolean;
  published?: boolean;
  publishedAt?: string | Date;
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

export function AnnouncementEditor({
  initial,
  mode,
}: {
  initial: AnnouncementData;
  mode: "new" | "edit";
}) {
  const router = useRouter();
  const [data, setData] = useState<AnnouncementData>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const suggestedSlug = useMemo(() => slugify(data.title || ""), [data.title]);
  const effectiveSlug = slugTouched ? data.slug : suggestedSlug;

  function set<K extends keyof AnnouncementData>(
    key: K,
    value: AnnouncementData[K],
  ) {
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
      ...(publishOverride !== undefined ? { published: publishOverride } : {}),
    };

    try {
      const url =
        mode === "edit"
          ? `/api/admin/announcements/${data._id}`
          : "/api/admin/announcements";
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
        router.push(`/admin/announcements/${json.item._id}`);
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
      const res = await fetch(`/api/admin/announcements/${data._id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.ok) {
        setMsg(json.error || "Delete failed.");
        return;
      }
      router.push("/admin/announcements");
    } catch (err: any) {
      setMsg(err?.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  function openFilePicker() {
    setUploadError(null);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError(
        `File too large. Max 10 MB. Yours: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      );
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const url = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/admin/upload/image");

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
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

      set("cover", url);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(null), 800);
    } catch (err: any) {
      setUploadError(err?.message || "Upload failed.");
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  }

  const isPublished = !!data.published;
  const isPinned = !!data.pinned;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Link
          href="/admin/announcements"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink transition-colors mr-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          All announcements
        </Link>

        {mode === "edit" && (
          <>
            <button
              onClick={() => set("pinned", !isPinned)}
              disabled={busy}
              className="btn-ghost !py-2 !text-xs"
              title={isPinned ? "Unpin" : "Pin"}
            >
              {isPinned ? (
                <>
                  <PinOff className="w-3.5 h-3.5" strokeWidth={2} /> Unpin
                </>
              ) : (
                <>
                  <Pin className="w-3.5 h-3.5" strokeWidth={2} /> Pin
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
                href={`/announcements/${effectiveSlug}`}
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
      <div className="flex items-center gap-2 mb-8">
        <span
          className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded"
          style={{
            background: isPublished ? "#DCFCE7" : "var(--rule)",
            color: isPublished ? "#15803D" : "var(--ink-2)",
          }}
        >
          {isPublished ? "Published" : "Draft"}
        </span>
        {isPinned && (
          <span
            className="text-[10.5px] font-mono uppercase tracking-wider px-2 py-1 rounded inline-flex items-center gap-1"
            style={{ background: "var(--brand-100)", color: "var(--brand)" }}
          >
            <Pin className="w-2.5 h-2.5" strokeWidth={2} /> Pinned
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
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 lg:gap-8">
        {/* Editor */}
        <div className="space-y-5">
          <FieldSection title="Content">
            <Field
              label="Title"
              value={data.title}
              onChange={(v) => set("title", v)}
              placeholder="A short, punchy title"
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
              label="Category"
              value={data.category || ""}
              onChange={(v) => set("category", v)}
              placeholder="e.g. Launch, Update, Milestone"
            />
            <Field
              label="Summary"
              value={data.summary || ""}
              onChange={(v) => set("summary", v)}
              placeholder="One or two sentences shown in list views and social previews."
              multiline
              rows={2}
            />
          </FieldSection>

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
              rows={16}
              mono
              hint="Supports lightweight markdown: ##, ###, -, and >. Blank line separates blocks."
            />
          </FieldSection>

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
                  placeholder="https://... or upload one below"
                  className="flex-1 px-3 py-2 rounded-lg border border-rule bg-base text-[13.5px] focus:outline-none focus:border-ink-3 transition-colors"
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
              <p className="text-[10.5px] text-ink-3 mt-1">
                Optional. Paste any public URL, or use &ldquo;Load
                picture&rdquo; below to upload.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={openFilePicker}
                disabled={uploading}
                className="btn-ghost !py-2 !text-xs w-full sm:w-auto justify-center"
              >
                {uploading ? (
                  <>
                    <Loader2
                      className="w-3.5 h-3.5 animate-spin"
                      strokeWidth={2}
                    />
                    Uploading{" "}
                    {uploadProgress !== null ? `${uploadProgress}%` : "…"}
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" strokeWidth={2} />
                    Load picture from your computer
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleFileSelected}
                className="hidden"
              />

              {uploadProgress !== null && (
                <div className="mt-2 h-1 bg-rule rounded overflow-hidden">
                  <div
                    className="h-full transition-all duration-200"
                    style={{
                      width: `${uploadProgress}%`,
                      background: "var(--brand)",
                    }}
                  />
                </div>
              )}

              {uploadError && (
                <p className="text-[12px] text-red-700 bg-red-50 px-3 py-2 rounded-md mt-2">
                  {uploadError}
                </p>
              )}

              <p className="text-[10.5px] text-ink-3 mt-2">
                JPEG, PNG, WebP, GIF, or AVIF · max 10 MB. Auto-optimised on
                upload.
              </p>
            </div>

            {data.cover && (
              <div className="mt-3 relative aspect-[16/9] rounded-lg overflow-hidden border border-rule bg-tint-1">
                <Image
                  src={data.cover}
                  alt="Cover preview"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </FieldSection>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="eyebrow mb-4">Preview</p>
          <div className="rounded-2xl border border-rule bg-white overflow-hidden">
            <div className="p-4">
              <div
                className="aspect-[16/9] rounded-xl overflow-hidden relative"
                style={{
                  background:
                    "linear-gradient(135deg, var(--brand-50) 0%, var(--brand-100) 100%)",
                }}
              >
                {data.cover ? (
                  <Image
                    src={data.cover}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center">
                    <span
                      className="h-display text-6xl opacity-30"
                      style={{ color: "var(--brand)" }}
                    >
                      {data.category?.charAt(0)?.toUpperCase() || "N"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-8">
              <div className="flex items-center gap-2 mb-3">
                {data.category && (
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider"
                    style={{ color: "var(--brand)" }}
                  >
                    {data.category}
                  </span>
                )}
                {data.category && (
                  <span className="text-[10px] font-mono text-ink-3">·</span>
                )}
                <span className="text-[10px] font-mono text-ink-3">
                  {data.publishedAt
                    ? new Date(data.publishedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "Not yet published"}
                </span>
              </div>

              <h3 className="h-display text-[22px] tracking-tighter leading-tight mb-3">
                {data.title || "Untitled announcement"}
              </h3>

              {data.summary && (
                <p className="text-[13.5px] text-ink-2 leading-relaxed mb-6">
                  {data.summary}
                </p>
              )}

              <div className="pt-5 border-t border-rule">
                <BodyPreview text={data.body || ""} />
              </div>
            </div>
          </div>
        </div>
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
