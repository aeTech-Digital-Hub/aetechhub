import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Brand colours
const BRAND = "#2D0D50";
const BRAND_100 = "#EDE3F4";
const RULE = "#ECE6DD";
const INK = "#0A0A0A";
const INK_2 = "#525252";
const INK_3 = "#A3A3A3";
const BASE = "#FCFAF7";
const PAID_GREEN = "#15803D";
const PAID_BG = "#DCFCE7";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    backgroundColor: BASE,
    fontSize: 10,
    color: INK,
  },
  // Letterhead
  letterhead: {
    backgroundColor: BRAND,
    padding: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandText: { color: "#fff" },
  brandTagline: {
    color: "#fff",
    opacity: 0.7,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  brandName: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5,
  },
  letterheadRight: { textAlign: "right" },
  receiptLabel: {
    color: "#fff",
    opacity: 0.7,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  receiptNo: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  // Body
  body: { padding: 32 },
  // PAID stamp — large, dominant, the visual anchor of a receipt
  paidStamp: {
    backgroundColor: PAID_BG,
    borderRadius: 8,
    padding: 20,
    marginBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PAID_GREEN,
    borderStyle: "solid",
  },
  paidLeft: {},
  paidLabel: {
    color: PAID_GREEN,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  paidAmount: {
    color: PAID_GREEN,
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    letterSpacing: -0.5,
  },
  paidRight: { textAlign: "right" },
  paidDate: {
    fontSize: 10,
    color: PAID_GREEN,
    marginBottom: 2,
  },
  paidMethod: {
    fontSize: 9,
    color: PAID_GREEN,
    opacity: 0.8,
  },
  // Meta
  metaGrid: {
    flexDirection: "row",
    marginBottom: 28,
    gap: 24,
  },
  metaCol: { flex: 1 },
  metaLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: INK_3,
    marginBottom: 4,
  },
  metaValue: { fontSize: 11, color: INK, marginBottom: 2 },
  metaValueMuted: { fontSize: 10, color: INK_2 },
  // Items detail (small reference table)
  detailHeader: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: BRAND,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  detailBox: {
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: RULE,
    borderStyle: "solid",
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    fontSize: 10,
    color: INK_2,
  },
  detailRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: RULE,
    borderTopStyle: "solid",
    fontSize: 11,
    color: INK,
  },
  // Reference back to invoice
  refBox: {
    backgroundColor: BRAND_100,
    borderRadius: 6,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  refLabel: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: BRAND,
  },
  refValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  // Thank-you note
  thanks: {
    fontSize: 11,
    color: INK_2,
    textAlign: "center",
    paddingVertical: 16,
    fontStyle: "italic",
  },
  // Footer
  footer: {
    marginTop: "auto",
    paddingTop: 24,
    paddingHorizontal: 32,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: RULE,
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: INK_3,
  },
  footerCol: { flex: 1 },
  footerColRight: { flex: 1, textAlign: "right" },
});

export type ReceiptPdfData = {
  receiptNo: string;
  invoiceNo: string;
  client: {
    name: string;
    email?: string;
    company?: string;
    address?: string;
    phone?: string;
  };
  items: { description: string; qty: number; rate: number; amount: number }[];
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  total: number;
  paidAmount: number;
  currency: "USD" | "GHS";
  issueDate: Date | string;
  paidAt: Date | string;
  paymentMethod?: string;
};

function fmt(amount: number, currency: "USD" | "GHS"): string {
  const symbol = currency === "USD" ? "$" : "GHS ";
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(d: Date | string | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function ReceiptPdf({ rec }: { rec: ReceiptPdfData }) {
  return (
    <Document
      title={`Receipt ${rec.receiptNo}`}
      author="aeTech Digital Hub"
      creator="aeTech Digital Hub"
    >
      <Page size="A4" style={styles.page}>
        {/* LETTERHEAD */}
        <View style={styles.letterhead}>
          <View style={styles.brandLeft}>
            <View style={styles.brandText}>
              <Text style={styles.brandTagline}>Receipt</Text>
              <Text style={styles.brandName}>aeTech Digital Hub</Text>
            </View>
          </View>
          <View style={styles.letterheadRight}>
            <Text style={styles.receiptLabel}>Receipt No.</Text>
            <Text style={styles.receiptNo}>{rec.receiptNo}</Text>
          </View>
        </View>

        {/* BODY */}
        <View style={styles.body}>
          {/* PAID stamp — the visual anchor */}
          <View style={styles.paidStamp}>
            <View style={styles.paidLeft}>
              <Text style={styles.paidLabel}>Paid in full</Text>
              <Text style={styles.paidAmount}>
                {fmt(rec.paidAmount, rec.currency)}
              </Text>
            </View>
            <View style={styles.paidRight}>
              <Text style={styles.paidDate}>{fmtDate(rec.paidAt)}</Text>
              {rec.paymentMethod && (
                <Text style={styles.paidMethod}>via {rec.paymentMethod}</Text>
              )}
            </View>
          </View>

          {/* Reference back to the invoice */}
          <View style={styles.refBox}>
            <Text style={styles.refLabel}>For invoice</Text>
            <Text style={styles.refValue}>{rec.invoiceNo}</Text>
          </View>

          {/* Meta */}
          <View style={styles.metaGrid}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Received from</Text>
              <Text
                style={[styles.metaValue, { fontFamily: "Helvetica-Bold" }]}
              >
                {rec.client.name}
              </Text>
              {rec.client.company && (
                <Text style={styles.metaValue}>{rec.client.company}</Text>
              )}
              {rec.client.email && (
                <Text style={styles.metaValueMuted}>{rec.client.email}</Text>
              )}
              {rec.client.address && (
                <Text style={styles.metaValueMuted}>{rec.client.address}</Text>
              )}
            </View>
            <View style={[styles.metaCol, { textAlign: "right" }]}>
              <Text style={styles.metaLabel}>Receipt issued</Text>
              <Text style={styles.metaValue}>{fmtDate(new Date())}</Text>
              <Text style={[styles.metaLabel, { marginTop: 8 }]}>
                Invoice dated
              </Text>
              <Text style={styles.metaValue}>{fmtDate(rec.issueDate)}</Text>
            </View>
          </View>

          {/* Detail — what was paid for */}
          <Text style={styles.detailHeader}>Payment details</Text>
          <View style={styles.detailBox}>
            {rec.items.map((it, i) => (
              <View key={i} style={styles.detailRow}>
                <Text style={{ flex: 4 }}>{it.description}</Text>
                <Text style={{ textAlign: "right" }}>
                  {fmt(it.amount, rec.currency)}
                </Text>
              </View>
            ))}
            <View style={{ height: 6 }} />
            <View style={styles.detailRow}>
              <Text>Subtotal</Text>
              <Text>{fmt(rec.subtotal, rec.currency)}</Text>
            </View>
            {rec.discountAmount ? (
              <View style={styles.detailRow}>
                <Text>Discount</Text>
                <Text>−{fmt(rec.discountAmount, rec.currency)}</Text>
              </View>
            ) : null}
            {rec.taxAmount ? (
              <View style={styles.detailRow}>
                <Text>Tax</Text>
                <Text>{fmt(rec.taxAmount, rec.currency)}</Text>
              </View>
            ) : null}
            <View style={styles.detailRowLast}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>
                Total received
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold", color: PAID_GREEN }}>
                {fmt(rec.paidAmount, rec.currency)}
              </Text>
            </View>
          </View>

          {/* Thank-you */}
          <Text style={styles.thanks}>Thank you for your business.</Text>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <Text>aeTech Digital Hub</Text>
            <Text>Spintex Flower Port, Accra, Ghana</Text>
          </View>
          <View style={styles.footerColRight}>
            <Text>ephraim@aetechdigitalhub.com</Text>
            <Text>+233 55 444 8061</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
