import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

// Brand colours mirror our design system
const BRAND = "#2D0D50";
const BRAND_600 = "#5C3373";
const BRAND_100 = "#EDE3F4";
const RULE = "#ECE6DD";
const INK = "#0A0A0A";
const INK_2 = "#525252";
const INK_3 = "#A3A3A3";
const BASE = "#FCFAF7";

// Register Geist if available locally; otherwise PDF falls back to Helvetica.
// react-pdf needs absolute file paths or URLs.
try {
  // Try to register Geist if the user has it locally — best-effort, silent on failure
  const fontPath = path.join(process.cwd(), "public", "fonts");
  if (fs.existsSync(fontPath)) {
    const reg = path.join(fontPath, "Geist-Regular.ttf");
    const med = path.join(fontPath, "Geist-Medium.ttf");
    const mono = path.join(fontPath, "GeistMono-Regular.ttf");
    if (fs.existsSync(reg) && fs.existsSync(med)) {
      Font.register({
        family: "Geist",
        fonts: [
          { src: reg, fontWeight: 400 },
          { src: med, fontWeight: 500 },
        ],
      });
    }
    if (fs.existsSync(mono)) {
      Font.register({ family: "GeistMono", src: mono });
    }
  }
} catch {
  // Font registration is best-effort. PDF will fall back to Helvetica.
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    backgroundColor: BASE,
    fontSize: 10,
    color: INK,
  },
  // Letterhead band
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
  logo: { width: 36, height: 36 },
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
  invoiceLabel: {
    color: "#fff",
    opacity: 0.7,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  invoiceNo: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  // Body
  body: { padding: 32 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    borderBottomStyle: "solid",
  },
  metaCol: { flex: 1 },
  metaLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: INK_3,
    marginBottom: 4,
  },
  metaValue: { fontSize: 11, color: INK },
  // Items table
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: BRAND_100,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: BRAND,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    borderBottomStyle: "solid",
  },
  tableCell: { fontSize: 10, color: INK },
  colDescription: { flex: 5 },
  colQty: { flex: 1, textAlign: "right" },
  colRate: { flex: 1.5, textAlign: "right" },
  colAmount: { flex: 1.5, textAlign: "right" },
  // Totals
  totalsBox: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: "50%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    fontSize: 10,
    color: INK_2,
  },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 8,
    backgroundColor: BRAND,
    borderRadius: 6,
  },
  totalLabelFinal: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  totalValueFinal: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
  },
  // Notes & terms
  notes: {
    marginTop: 32,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: RULE,
    borderStyle: "solid",
  },
  notesLabel: {
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: INK_3,
    marginBottom: 6,
  },
  notesText: { fontSize: 10, color: INK_2, lineHeight: 1.5 },
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

export type InvoicePdfData = {
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
  currency: "USD" | "GHS";
  issueDate: Date | string;
  dueDate?: Date | string;
  notes?: string;
  terms?: string;
  status: string;
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

export function InvoicePdf({ inv }: { inv: InvoicePdfData }) {
  return (
    <Document
      title={`Invoice ${inv.invoiceNo}`}
      author="aeTech Digital Hub"
      creator="aeTech Digital Hub"
    >
      <Page size="A4" style={styles.page}>
        {/* LETTERHEAD */}
        <View style={styles.letterhead}>
          <View style={styles.brandLeft}>
            <View style={styles.brandText}>
              <Text style={styles.brandTagline}>Invoice</Text>
              <Text style={styles.brandName}>aeTech Digital Hub</Text>
            </View>
          </View>
          <View style={styles.letterheadRight}>
            <Text style={styles.invoiceLabel}>Invoice No.</Text>
            <Text style={styles.invoiceNo}>{inv.invoiceNo}</Text>
          </View>
        </View>

        {/* BODY */}
        <View style={styles.body}>
          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Billed to</Text>
              <Text
                style={[styles.metaValue, { fontFamily: "Helvetica-Bold" }]}
              >
                {inv.client.name}
              </Text>
              {inv.client.company && (
                <Text style={styles.metaValue}>{inv.client.company}</Text>
              )}
              {inv.client.email && (
                <Text style={[styles.metaValue, { color: INK_2 }]}>
                  {inv.client.email}
                </Text>
              )}
              {inv.client.address && (
                <Text style={[styles.metaValue, { color: INK_2 }]}>
                  {inv.client.address}
                </Text>
              )}
            </View>
            <View style={[styles.metaCol, { textAlign: "right" }]}>
              <Text style={styles.metaLabel}>Issue date</Text>
              <Text style={styles.metaValue}>{fmtDate(inv.issueDate)}</Text>
              {inv.dueDate && (
                <>
                  <Text style={[styles.metaLabel, { marginTop: 8 }]}>Due</Text>
                  <Text style={styles.metaValue}>{fmtDate(inv.dueDate)}</Text>
                </>
              )}
              <Text style={[styles.metaLabel, { marginTop: 8 }]}>Status</Text>
              <Text
                style={[
                  styles.metaValue,
                  {
                    color:
                      inv.status === "paid"
                        ? "#15803D"
                        : inv.status === "overdue"
                          ? "#B91C1C"
                          : INK,
                    textTransform: "capitalize",
                  },
                ]}
              >
                {inv.status}
              </Text>
            </View>
          </View>

          {/* Items table */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>
              Amount
            </Text>
          </View>
          {inv.items.map((it, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {it.description}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>{it.qty}</Text>
              <Text style={[styles.tableCell, styles.colRate]}>
                {fmt(it.rate, inv.currency)}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount]}>
                {fmt(it.amount, inv.currency)}
              </Text>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text>Subtotal</Text>
              <Text>{fmt(inv.subtotal, inv.currency)}</Text>
            </View>
            {inv.discountAmount ? (
              <View style={styles.totalsRow}>
                <Text>Discount</Text>
                <Text>−{fmt(inv.discountAmount, inv.currency)}</Text>
              </View>
            ) : null}
            {inv.taxAmount ? (
              <View style={styles.totalsRow}>
                <Text>Tax</Text>
                <Text>{fmt(inv.taxAmount, inv.currency)}</Text>
              </View>
            ) : null}
            <View style={styles.totalsRowFinal}>
              <Text style={styles.totalLabelFinal}>Total due</Text>
              <Text style={styles.totalValueFinal}>
                {fmt(inv.total, inv.currency)}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {inv.notes && (
            <View style={styles.notes}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{inv.notes}</Text>
            </View>
          )}

          {/* Terms */}
          {inv.terms && (
            <View style={[styles.notes, { marginTop: 12 }]}>
              <Text style={styles.notesLabel}>Terms</Text>
              <Text style={styles.notesText}>{inv.terms}</Text>
            </View>
          )}
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
