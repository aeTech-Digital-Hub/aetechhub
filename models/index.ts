import mongoose, { Schema, models, model } from 'mongoose';

// Research articles / blog
const ResearchSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    excerpt: String,
    cover: String,
    body: String,             // markdown
    author: String,
    category: { type: String, enum: ['research', 'engineering', 'design', 'business'], default: 'research' },
    tags: [String],
    readTime: Number,
    published: { type: Boolean, default: false },
    publishedAt: Date,
  },
  { timestamps: true }
);

// Public announcements + product launches
const AnnouncementSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    type: { type: String, enum: ['announcement', 'launch', 'patronage', 'milestone'], default: 'announcement' },
    excerpt: String,
    body: String,
    cover: String,
    pinned: { type: Boolean, default: false },
    published: { type: Boolean, default: false },
    publishedAt: Date,
  },
  { timestamps: true }
);

// Bookings (consultation calls)
const BookingSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    company: String,
    topic: String,
    date: { type: Date, required: true },
    timeSlot: String,           // e.g. "10:00–10:30"
    duration: { type: Number, default: 30 },
    notes: String,
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'requested',
    },
    meetingLink: String,
  },
  { timestamps: true }
);

// Chat messages (live support)
const MessageSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    sender: { type: String, enum: ['client', 'admin', 'system'], required: true },
    name: String,
    email: String,
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Funnel tracking events
const TrackSchema = new Schema(
  {
    sessionId: String,
    event: String,            // page_view | cta_click | form_start | form_submit | scope_complete | ...
    path: String,
    referrer: String,
    meta: { type: Schema.Types.Mixed },
    userAgent: String,
    country: String,
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

// Newsletter / lead capture
const SubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: String,
    source: String,
    confirmed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Research     = models.Research     || model('Research',     ResearchSchema);
export const Announcement = models.Announcement || model('Announcement', AnnouncementSchema);
export const Booking      = models.Booking      || model('Booking',      BookingSchema);
export const Message      = models.Message      || model('Message',      MessageSchema);
export const Track        = models.Track        || model('Track',        TrackSchema);
export const Subscriber   = models.Subscriber   || model('Subscriber',   SubscriberSchema);
