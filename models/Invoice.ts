import mongoose, { Schema, models, model } from "mongoose";

const LineItemSchema = new Schema(
  {
    description: { type: String, required: true },
    qty: { type: Number, default: 1 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  { _id: false },
);

const InvoiceSchema = new Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    client: {
      name: { type: String, required: true },
      email: String,
      company: String,
      address: String,
      phone: String,
    },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    briefId: { type: Schema.Types.ObjectId, ref: "Brief" },
    items: [LineItemSchema],
    subtotal: Number,
    discountPct: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxPct: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: Number,
    currency: { type: String, enum: ["USD", "GHS"], default: "USD" },
    issueDate: { type: Date, default: Date.now },
    dueDate: Date,
    status: {
      type: String,
      enum: ["draft", "sent", "viewed", "paid", "partial", "overdue", "void"],
      default: "draft",
    },
    paidAmount: { type: Number, default: 0 },
    paidAt: Date,
    paymentMethod: String,
    notes: String,
    terms: String,
    // Public share link — random token + expiry (for the invoice)
    shareToken: { type: String, index: true, sparse: true },
    shareTokenExpires: Date,
    shareCount: { type: Number, default: 0 },
    lastSharedAt: Date,
    // Receipt share link — separate token, only meaningful when status = 'paid'
    receiptShareToken: { type: String, index: true, sparse: true },
    receiptShareTokenExpires: Date,
    receiptShareCount: { type: Number, default: 0 },
    lastReceiptSharedAt: Date,
  },
  { timestamps: true },
);

// Dev: recompile model on schema changes
if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as any).Invoice;
}

export const Invoice = models.Invoice || model("Invoice", InvoiceSchema);
