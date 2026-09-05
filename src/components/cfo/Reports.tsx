import { useMemo } from "react";
import { FileText, Printer } from "lucide-react";
import { cashFlow, fyLabel, inr, plStatement, type Txn } from "@/lib/finance";

export function Reports({ txns, cash, fy }: { txns: Txn[]; cash: number; fy: string }) {
  const pl = useMemo(() => plStatement(txns, fy), [txns, fy]);
  const cf = useMemo(() => cashFlow(txns, fy, cash), [txns, fy, cash]);

  return (
    <section id="reports" className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-primary" /> Export reports — {fyLabel(fy)}
        </h2>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Printer className="h-3.5 w-3.5" /> Export P&amp;L (PDF / Print)
        </button>
      </div>

      <div id="statements" className="space-y-6">
        <Statement title={`Statement of Profit and Loss — ${fyLabel(fy)}`}>
          <Row label="I. Revenue from operations" bold />
          {pl.revenue.map(([c, v]) => (
            <Row key={c} label={c} amount={v} indent />
          ))}
          <Row label="Total revenue (I)" amount={pl.totalRevenue} bold rule />

          <Row label="II. Cost of goods sold (COGS)" bold />
          {pl.cogs.map(([c, v]) => (
            <Row key={c} label={c} amount={v} indent />
          ))}
          <Row label="Total COGS (II)" amount={pl.totalCogs} bold rule />

          <Row
            label={`III. Gross profit (I - II) — margin ${pl.grossMargin.toFixed(1)}%`}
            amount={pl.grossProfit}
            bold
            rule
          />

          <Row label="IV. Operating expenses" bold />
          {pl.opex.map(([c, v]) => (
            <Row key={c} label={c} amount={v} indent />
          ))}
          <Row label="Total operating expenses (IV)" amount={pl.totalOpex} bold rule />

          <Row label="V. Profit before tax (III - IV)" amount={pl.ebitda} bold />
          <Row label="VI. Tax expense (GST & statutory)" amount={pl.totalTax} indent />
          <Row label="VII. Net profit / (loss) for the year" amount={pl.netProfit} bold rule />
        </Statement>

        <Statement title={`Cash Flow Statement — ${fyLabel(fy)}`}>
          <Row label="Opening cash and cash equivalents" amount={cf.opening} />
          <Row label="Cash flows from operating activities" bold />
          {cf.monthly.map((m) => (
            <Row key={m.month} label={m.label} amount={m.net} indent />
          ))}
          <Row label="Net increase / (decrease) in cash" amount={cf.netChange} bold rule />
          <Row label="Closing cash and cash equivalents" amount={cf.closing} bold />
        </Statement>
      </div>

      <p className="mt-4 text-xs text-muted-foreground print:hidden">
        Amounts in INR (Indian numbering system). Financial year follows the Indian convention
        (1 April – 31 March). Use your browser&rsquo;s &ldquo;Save as PDF&rdquo; destination to export.
      </p>
    </section>
  );
}

function Statement({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-4 print:border-0 print:bg-transparent">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">(All amounts in Indian Rupees)</p>
      <table className="mt-3 w-full text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-1.5 text-left font-medium">Particulars</th>
            <th className="py-1.5 text-right font-medium">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Row({
  label,
  amount,
  bold,
  indent,
  rule,
}: {
  label: string;
  amount?: number;
  bold?: boolean;
  indent?: boolean;
  rule?: boolean;
}) {
  return (
    <tr className={rule ? "border-t border-border" : ""}>
      <td className={`py-1.5 ${indent ? "pl-4" : ""} ${bold ? "font-semibold" : ""}`}>{label}</td>
      <td className={`num py-1.5 text-right ${bold ? "font-semibold" : ""}`}>
        {amount === undefined
          ? ""
          : amount < 0
            ? `(${inr(Math.abs(amount))})`
            : inr(amount)}
      </td>
    </tr>
  );
}
