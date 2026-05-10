import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    // Optional — present for password accounts, absent for Google-only
    passwordHash: { type: String },

    // Optional — present for accounts linked to a Google identity
    googleId: { type: String, index: true, sparse: true },
    avatar: String,

    // Two-role model going forward. Old `editor` / `client` rows keep working,
    // we just don't issue new ones. Anyone non-admin is treated as a regular user.
    role: {
      type: String,
      enum: ["admin", "editor", "client", "user"],
      default: "user",
    },

    // Profile (used in pre-fill on forms)
    company: String,
    phone: String,

    // Privacy / consent / source tracking
    signupSource: {
      type: String,
      enum: ["password", "google", "admin-seed"],
      default: "password",
    },
    consentAt: Date, // when they accepted the terms / privacy notice
    consentVersion: String, // bumps when terms change so we can re-prompt
    signupIpHash: String, // sha256 of IP at signup, never raw IP
    lastSignInAt: Date,
    lastSignInIpHash: String,

    // Soft-delete / GDPR-style
    deletedAt: Date, // tombstone — login disabled, PII can be wiped on schedule
  },
  { timestamps: true },
);

// Helpful indexes
UserSchema.index({ deletedAt: 1 });

// Dev: recompile on schema edits
if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as any).User;
}

export type IUser = mongoose.InferSchemaType<typeof UserSchema> & {
  _id: string;
};
export const User = models.User || model("User", UserSchema);
