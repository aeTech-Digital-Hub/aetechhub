import mongoose, { Schema, models, model } from "mongoose";

// Public projects (case studies in portfolio)
const ProjectSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    tagline: String,
    client: String,
    year: Number,
    services: [String],
    cover: String,
    gallery: [String],
    summary: String,
    challenge: String,
    approach: String,
    outcome: String,
    metrics: [{ label: String, value: String }],
    techStack: [String],
    liveUrl: String,
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Project briefs / requests (from the public form)
const BriefSchema = new Schema(
  {
    // Public-facing short ID for the brief (e.g. "BRF-7K8M2N") — shareable
    briefId: { type: String, unique: true, sparse: true, index: true },

    // Contact info — required to start the structured brief
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: String,
    phone: String,

    // Original quick-form fields (still used by /start-project)
    projectType: String,
    services: [String],
    budget: String,
    timeline: String,
    summary: String,
    aiScopeTranscript: [{ q: String, a: String }],
    suggestedPackage: String,
    estimatedCost: Number,

    // Structured brief sections — populated by the /brief editor
    structured: {
      aboutYou: String,
      problem: String,
      success: String,
      tried: String,
      constraints: String,
      risks: String,
      anythingElse: String,
    },
    completionPercent: { type: Number, default: 0 },

    // Lifecycle tracking
    source: String, // funnel attribution
    fingerprint: { type: String, index: true }, // browser UUID for resume
    lastEditedAt: Date, // updates on every save
    submittedAt: Date, // null until they submit
    abandonedAt: Date, // set by a job after N hrs idle
    followedUpAt: Date, // when admin reaches out
    convertedTo: { type: Schema.Types.ObjectId, ref: "Project" },

    status: {
      type: String,
      enum: [
        "draft", // gate passed, brief in progress
        "submitted", // user clicked submit
        "abandoned", // gate passed but no activity for 48h+
        "reviewing", // admin has it under review
        "in-discussion", // call booked / replied
        "quoted", // proposal sent
        "won",
        "lost",
        "archived",
      ],
      default: "draft",
    },
    notes: String,
  },
  { timestamps: true },
);

// Anonymous visit tracking — every hit to /brief or /brief/guide creates a row.
// No PII. Used to track funnel & retention. Identified visitors get linked back via fingerprint.
const BriefVisitSchema = new Schema(
  {
    fingerprint: { type: String, index: true },
    page: { type: String, enum: ["guide", "editor", "submitted", "gate"] },
    ipHash: String, // SHA256 of IP, no recoverable address
    userAgent: String,
    referrer: String,
    visitedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);
// Auto-prune visits after 90 days
BriefVisitSchema.index(
  { visitedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

// In dev, delete cached models so schema edits take effect without a hard restart.
// In prod, the cached model is fine and re-using it is faster.
if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as any).Brief;
  delete (mongoose.models as any).BriefVisit;
  delete (mongoose.models as any).Project;
}

export const Project = models.Project || model("Project", ProjectSchema);
export const Brief = models.Brief || model("Brief", BriefSchema);
export const BriefVisit =
  models.BriefVisit || model("BriefVisit", BriefVisitSchema);
