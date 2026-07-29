import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { recordAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/upload/image
 *
 * Accepts multipart/form-data with a single "file" field. Uploads to Cloudinary
 * (or reports a helpful error if Cloudinary is not configured) and returns
 * the public URL of the uploaded image.
 *
 * Setup (once, in Cloudinary dashboard):
 *   1. Create free account at cloudinary.com
 *   2. Settings → Upload → Add upload preset
 *      - Signing mode: UNSIGNED
 *      - Folder: aetech-announcements
 *      - Format: Auto
 *      - Quality: Auto
 *      - Save the preset name
 *   3. Get your cloud name from the dashboard (top right)
 *
 * Env vars (add to .env and to Render):
 *   CLOUDINARY_CLOUD_NAME=xxx
 *   CLOUDINARY_UPLOAD_PRESET=xxx        (the unsigned preset from step 2)
 *   CLOUDINARY_UPLOAD_FOLDER=aetech     (optional; folder within the preset)
 *
 * Limits:
 *   - Max file size: 10 MB (Cloudinary free tier max on unsigned uploads)
 *   - Allowed types: image/jpeg, image/png, image/webp, image/gif, image/avif
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Image uploads are not configured. Add CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET to your environment, or paste an image URL manually.",
        configured: false,
      },
      { status: 503 },
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { ok: false, error: "Invalid form submission." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "No file provided." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        ok: false,
        error: `File too large. Max 10 MB. Yours: ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      },
      { status: 413 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, AVIF.`,
      },
      { status: 415 },
    );
  }

  // Proxy to Cloudinary. We forward the file as-is with the preset name.
  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("upload_preset", uploadPreset);
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER;
  if (folder) uploadForm.append("folder", folder);

  try {
    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadForm,
      },
    );
    const cloudJson: any = await cloudRes.json();

    if (!cloudRes.ok || !cloudJson.secure_url) {
      console.error("[upload] Cloudinary error:", cloudJson);
      return NextResponse.json(
        {
          ok: false,
          error:
            cloudJson?.error?.message || "Upload failed at storage provider.",
        },
        { status: 502 },
      );
    }

    // Audit
    await recordAdminAction({
      user: { id: user.sub, email: user.email },
      action: "image.upload",
      req,
      metadata: {
        publicId: cloudJson.public_id,
        bytes: cloudJson.bytes,
        format: cloudJson.format,
        width: cloudJson.width,
        height: cloudJson.height,
      },
    });

    return NextResponse.json({
      ok: true,
      url: cloudJson.secure_url,
      publicId: cloudJson.public_id,
      width: cloudJson.width,
      height: cloudJson.height,
      format: cloudJson.format,
      bytes: cloudJson.bytes,
    });
  } catch (err: any) {
    console.error("[upload] Network error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Upload failed. Please try again or paste a URL instead.",
      },
      { status: 500 },
    );
  }
}
