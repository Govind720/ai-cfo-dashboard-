import { useMemo, useState } from "react";
import { YearComparisonChart } from "./Charts";
import { compareAcrossYears, comparisonElements, inr, type Txn } from "@/lib/finance";

export function Comparison({ txns }: { txns: Txn[] }) {
  const elements = useMemo(() => comparisonElements(txns), [txns]);
  const [element, setElement] = useState("Income");
  const active = elements.includes(element) ? element : (elements[0] ?? "Income");
  const { years, rows, totals } = useMemo(
    () => compareAcrossYears(txns, active),
    [txns, active],
  );

  return (
    <section id="compare" className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Year-on-year comparison</h2>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          Element
          <select
            value={active}
            onChange={(e) => setElement(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
          >
            {elements.map((el) => (
              <option key={el} value={el}>
                {el}
              </option>
            ))}
          </select>
        </label>
      </div>

      <YearComparisonChart rows={rows} years={years} />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {totals.map((t, i) => {
          const prev = totals[i - 1];
          const change = prev && prev.total ? ((t.total - prev.total) / prev.total) * 100 : null;
          return (
            <div key={t.year} className="rounded-lg border border-border bg-secondary/40 p-3">
              <p className="text-xs text-muted-foreground">{t.year}</p>
              <p className="num mt-1 text-lg font-semibold">{inr(t.total)}</p>
              {change !== null && (
                <p
                  className={`num text-xs ${change >= 0 ? "text-primary" : "text-destructive"}`}
                >
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(1)}% vs {prev!.year}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
