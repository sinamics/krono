import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ArsoppgjorData } from "@/features/arsoppgjor/Actions/getArsoppgjorData";

const EKOM_KEYS = [
  "ekom", "internet", "internett", "telefon", "mobil",
  "bredbånd", "bredband", "telekommunikasjon", "telekom/internet",
];

function getMvaAmount(amountNOK: number, mvaCode: string): number {
  if (mvaCode === "CODE_1") return amountNOK * 0.2;
  if (mvaCode === "CODE_86") return amountNOK * 0.25;
  return 0;
}

function getMvaLabel(mvaCode: string): string {
  const labels: Record<string, string> = {
    CODE_52: "Kode 52",
    CODE_86: "Kode 86",
    CODE_1: "Kode 1",
    CODE_11: "Kode 11",
    CODE_13: "Kode 13",
    CODE_81: "Kode 81",
  };
  return labels[mvaCode] ?? mvaCode;
}

function getPostForCategory(category: string): string {
  const direct: Record<string, string> = {
    Hosting: "6995",
    Abonnement: "6995",
    Kontor: "6995",
    Programvare: "6995",
    Regnskap: "6995",
    Utstyr: "6995",
    Reise: "7080",
    Forsikring: "7500",
    Markedsføring: "7330",
  };
  if (direct[category]) return direct[category];
  if (EKOM_KEYS.includes(category.toLowerCase())) return "6995";
  return "—";
}

function fmtCur(n: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
  },
  generatedAt: {
    fontSize: 7,
    color: "#999",
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  rowBorder: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    marginTop: 2,
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
  muted: {
    color: "#666",
  },
  warn: {
    color: "#b45309",
  },
  // Table styles
  table: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 4,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 2.5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  tableRowShaded: {
    flexDirection: "row",
    paddingVertical: 2.5,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  tableFooter: {
    flexDirection: "row",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#333",
    marginTop: 2,
  },
  // Column widths for cost overview
  colDate: { width: "15%" },
  colDesc: { width: "35%" },
  colMvaCode: { width: "12%" },
  colMva: { width: "13%", textAlign: "right" },
  colAmount: { width: "15%", textAlign: "right" },
  colPost: { width: "10%", textAlign: "right" },
  // Category summary columns
  catName: { width: "40%" },
  catPost: { width: "15%" },
  catCount: { width: "15%", textAlign: "right" },
  catAmount: { width: "30%", textAlign: "right" },
  // MVA term columns
  mvaTermCol: { width: "25%" },
  mvaLabelCol: { width: "25%" },
  mvaAmountCol: { width: "25%", textAlign: "right" },
  mvaStatusCol: { width: "25%", textAlign: "right" },
});

type Props = {
  data: ArsoppgjorData;
  year: number;
};

export function ArsoppgjorPdf({ data, year }: Props) {
  const totalTransactions = data.expensesByCategory.reduce(
    (sum, c) => sum + c.count,
    0
  );

  const post6995Total = data.expensesByCategory
    .filter((c) => getPostForCategory(c.category) === "6995")
    .reduce((sum, c) => sum + c.total, 0);

  return (
    <Document>
      {/* Page 1: Summary */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>Årsoppgjør {year}</Text>
          <Text style={s.subtitle}>
            {data.businessName ?? ""}
            {data.orgNr ? ` (Org.nr: ${data.orgNr})` : ""}
          </Text>
          <Text style={s.generatedAt}>
            Generert {fmtDate(new Date())} — Dokumentet er ment som
            underlag ved kontroll.
          </Text>
        </View>

        {/* Næringsspesifikasjon */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Næringsspesifikasjon</Text>
          <View style={s.row}>
            <Text>Sum driftsinntekter</Text>
            <Text>{fmtCur(data.totalSales)}</Text>
          </View>
          <View style={s.row}>
            <Text>Sum driftskostnader</Text>
            <Text>{fmtCur(data.totalExpenses)}</Text>
          </View>
          <View style={s.rowBorder}>
            <Text style={s.bold}>Årsresultat</Text>
            <Text style={s.bold}>
              {fmtCur(data.totalSales - data.totalExpenses)}
            </Text>
          </View>
        </View>

        {/* Justeringer */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Justeringer</Text>
          <View style={s.row}>
            <Text>EKOM privatandel — Post 6998</Text>
            <Text>{fmtCur(data.ekomPrivateDeduction)}</Text>
          </View>
          <View style={s.row}>
            <Text>Hjemmekontor sjablong — Post 7700</Text>
            <Text>{fmtCur(data.hjemmekontorFradrag)}</Text>
          </View>
          <View style={s.rowBorder}>
            <Text style={s.bold}>Næringsinntekt = Personinntekt</Text>
            <Text style={s.bold}>{fmtCur(data.naeringsresultat)}</Text>
          </View>
        </View>

        {/* EKOM detaljer */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>EKOM-detaljer</Text>
          <View style={s.row}>
            <Text>Dine EKOM-utgifter i {year}</Text>
            <Text>{fmtCur(data.ekomTotalCost)}</Text>
          </View>
          <View style={s.row}>
            <Text>Maks privatandel (sjablong)</Text>
            <Text>{fmtCur(4392)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.bold}>Privatandel (laveste av de to)</Text>
            <Text style={s.bold}>{fmtCur(data.ekomPrivateDeduction)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.warn}>MVA tilbakebetaling (20%)</Text>
            <Text style={s.warn}>{fmtCur(data.ekomMvaAdjustment)}</Text>
          </View>
        </View>

        {/* Kostnadsoversikt summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Kostnadsoversikt</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.catName, s.bold]}>Kategori</Text>
              <Text style={[s.catPost, s.bold]}>Post</Text>
              <Text style={[s.catCount, s.bold]}>Antall</Text>
              <Text style={[s.catAmount, s.bold]}>Beløp</Text>
            </View>
            {data.expensesByCategory.map((cat) => (
              <View key={cat.category} style={s.tableRow}>
                <Text style={s.catName}>{cat.category}</Text>
                <Text style={s.catPost}>
                  {getPostForCategory(cat.category)}
                </Text>
                <Text style={s.catCount}>{cat.count}</Text>
                <Text style={s.catAmount}>{fmtCur(cat.total)}</Text>
              </View>
            ))}
            <View style={s.tableFooter}>
              <Text style={[s.catName, s.bold]}>Totalt</Text>
              <Text style={s.catPost} />
              <Text style={[s.catCount, s.bold]}>{totalTransactions}</Text>
              <Text style={[s.catAmount, s.bold]}>
                {fmtCur(data.totalExpenses)}
              </Text>
            </View>
            <View style={[s.row, { marginTop: 4 }]}>
              <Text style={s.bold}>Sum post 6995</Text>
              <Text style={s.bold}>{fmtCur(post6995Total)}</Text>
            </View>
          </View>
        </View>

        {/* MVA årsoversikt */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>MVA årsoversikt</Text>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.mvaTermCol, s.bold]}>Termin</Text>
              <Text style={[s.mvaLabelCol, s.bold]}>Periode</Text>
              <Text style={[s.mvaAmountCol, s.bold]}>MVA</Text>
              <Text style={[s.mvaStatusCol, s.bold]}>Status</Text>
            </View>
            {data.mvaTerms.map((t) => (
              <View key={t.term} style={s.tableRow}>
                <Text style={s.mvaTermCol}>Termin {t.term}</Text>
                <Text style={s.mvaLabelCol}>{t.label}</Text>
                <Text style={s.mvaAmountCol}>{fmtCur(t.totalMva)}</Text>
                <Text style={s.mvaStatusCol}>
                  {t.status === "SUBMITTED" ? "Sendt" : "Utkast"}
                </Text>
              </View>
            ))}
            <View style={s.tableFooter}>
              <Text style={[s.mvaTermCol, s.bold]}>Totalt</Text>
              <Text style={s.mvaLabelCol} />
              <Text style={[s.mvaAmountCol, s.bold]}>
                {fmtCur(data.mvaTotalYear)}
              </Text>
              <Text style={s.mvaStatusCol} />
            </View>
          </View>
        </View>
      </Page>

      {/* Remaining pages: Detailed transactions per category */}
      {data.expensesByCategory.map((cat) => (
        <Page key={cat.category} size="A4" style={s.page}>
          <View style={s.header}>
            <Text style={s.title}>{cat.category}</Text>
            <Text style={s.subtitle}>
              {cat.count} transaksjoner — {fmtCur(cat.total)} — Post{" "}
              {getPostForCategory(cat.category)}
            </Text>
          </View>
          <View style={s.table}>
            <View style={s.tableHeader}>
              <Text style={[s.colDate, s.bold]}>Dato</Text>
              <Text style={[s.colDesc, s.bold]}>Beskrivelse</Text>
              <Text style={[s.colMvaCode, s.bold]}>MVA-kode</Text>
              <Text style={[s.colMva, s.bold]}>MVA</Text>
              <Text style={[s.colAmount, s.bold]}>Beløp</Text>
            </View>
            {cat.transactions.map((tx, i) => {
              const mva = getMvaAmount(tx.amountNOK, tx.mvaCode);
              return (
                <View
                  key={tx.id}
                  style={i % 2 === 0 ? s.tableRow : s.tableRowShaded}
                  wrap={false}
                >
                  <Text style={s.colDate}>{fmtDate(tx.date)}</Text>
                  <Text style={s.colDesc}>
                    {tx.description}
                    {tx.notes ? ` (${tx.notes})` : ""}
                  </Text>
                  <Text style={s.colMvaCode}>
                    {getMvaLabel(tx.mvaCode)}
                  </Text>
                  <Text style={[s.colMva, mva === 0 ? s.warn : {}]}>
                    {mva > 0 ? fmtCur(mva) : "Ingen"}
                  </Text>
                  <Text style={s.colAmount}>{fmtCur(tx.amountNOK)}</Text>
                </View>
              );
            })}
            <View style={s.tableFooter}>
              <Text style={s.colDate} />
              <Text style={[s.colDesc, s.bold]}>Sum {cat.category}</Text>
              <Text style={s.colMvaCode} />
              <Text style={[s.colMva, s.bold]}>
                {fmtCur(
                  cat.transactions.reduce(
                    (sum, tx) => sum + getMvaAmount(tx.amountNOK, tx.mvaCode),
                    0
                  )
                )}
              </Text>
              <Text style={[s.colAmount, s.bold]}>
                {fmtCur(cat.total)}
              </Text>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
}
