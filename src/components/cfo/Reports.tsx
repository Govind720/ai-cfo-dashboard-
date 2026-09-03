import { useMemo, useState } from "react";
import { FileText, Printer } from "lucide-react";
import { cashFlow, fiscalYears, inr, profitAndLoss, type Txn } from "@/lib/finance";

export function Reports({ txns, cash }: { txns: Txn[]; cash: number }) {
  const years = useMemo(() => fiscalYears(txns), [txns]);
  const [fy, setFy] = useState("");
  const activeFy = years.includes(fy) ? fy : (years.at(-1) ?? "");
  const pl = useMemo(() => profitAndLoss(txns, activeFy), [txns, activeFy]);
  const cf = useMemo(() => cashFlow(txns, activeFy, cash), [txns, activeFy, cash]);

  return (
    <section id="reports" className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-primary" /> Export reports
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={activeFy}
            onChange={(e) => setFy(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Printer className="h-3.5 w-3.5" /> Download PDF / Print
          </button>
        </div>
      </div>

      <div id="statements" className="space-y-6">
        <Statement title={`Statement of Profit and Loss — ${activeFy}`}>
          <Row label="I. Revenue from operations" bold />
          {pl.income.map(([c, v]) => (
            <Row key={c} label={c} amount={v} indent />
          ))}
          <Row label="Total income (I)" amount={pl.totalIncome} bold rule />

          <Row label="II. Expenses" bold />
          {pl.expenses
            .filter(([c]) => c !== "Taxes")
            .map(([c, v]) => (
              <Row key={c} label={c} amount={v} indent />
            ))}
          <Row
            label="Total expenses (II)"
            amount={pl.totalExpense - pl.taxes}
            bold
            rule
          />

          <Row label="III. Profit before tax (I - II)" amount={pl.pbt} bold />
          <Row label="IV. Tax expense (GST & statutory)" amount={pl.taxes} indent />
          <Row label="V. Profit / (Loss) for the year" amount={pl.net} bold rule />
        </Statement>

        <Statement title={`Cash Flow Statement — ${activeFy}`}>
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
        Amounts in INR. Financial year follows the Indian convention (1 April – 31 March).
        Use your browser&rsquo;s &ldquo;Save as PDF&rdquo; destination to export.
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
