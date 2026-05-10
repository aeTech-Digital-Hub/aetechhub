import mongoose, { Schema, models, model } from "mongoose";

/**
 * Newsletter subscribers. Distinct from User — no auth, no account,
 * no PII beyond email + optional name. Existing in this collection means
 * they consented to occasional dispatches.
 */
const SubscriberSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    name: String,
    source: {
      type: String,
      enum: ["footer", "welcome", "brief", "manual"],
      default: "footer",
    },
    confirmedAt: Date, // null until they click the confirm link
    confirmToken: String, // single-use, hashed, expires after 7 days
    confirmTokenExpires: Date,
    unsubscribedAt: Date, // soft-delete — keep the row for compliance
    unsubscribeToken: String, // one-click unsubscribe in every email
    ipHashAtSignup: String, // privacy-preserving abuse signal
  },
  { timestamps: true },
);

if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as any).Subscriber;
}

export const Subscriber =
  models.Subscriber || model("Subscriber", SubscriberSchema);
