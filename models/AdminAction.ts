import mongoose, { Schema, models, model } from "mongoose";

/**
 * Minimal audit log of admin actions. Records WHO did WHAT to WHICH ENTITY and WHEN.
 * Does NOT capture diffs / before-after state in this round — that's deferred.
 *
 * Use the `recordAdminAction` helper in lib/audit.ts to write these consistently.
 */
const AdminActionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userEmail: String, // denormalized for log readability if user is later deleted

    /** What was done */
    action: {
      type: String,
      required: true,
      // Open enum so we can add new actions without migrations
    },

    /** What it was done to */
    entityType: String, // 'invoice' | 'brief' | 'project' | 'user' | etc.
    entityId: String, // ObjectId as string
    entityLabel: String, // human-readable label for log readability (e.g. invoice number)

    /** Side info */
    ipHash: String,
    userAgent: String,
    metadata: Schema.Types.Mixed, // flexible bag for extra context (no PII please)
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// 90 days retention for audit logs by default — adjust if compliance requires longer
AdminActionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as any).AdminAction;
}

export const AdminAction =
  models.AdminAction || model("AdminAction", AdminActionSchema);
