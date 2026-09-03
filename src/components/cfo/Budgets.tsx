import { useMemo, useState } from "react";
import { AlertTriangle, Wand2 } from "lucide-react";
import {
  budgetStatus,
  inr,
  monthKey,
  monthLabel,
  suggestBudgets,
  type Txn,
} from "@/lib/finance";

export function Budgets({
  txns,
  budgets,
  setBudgets,
}: {
  txns: Txn[];
  budgets: Record<string, number>;
  setBudgets: (b: Record<string, number>) => void;
}) {
  const months = useMemo(
    () => [...new Set(txns.map((t) => monthKey(t.date)))].sort(),
    [txns],
  );
  const [month, setMonth] = useState("");
  const active = months.includes(month) ? month : (months.at(-1) ?? "");
  const rows = useMemo(() => budgetStatus(txns, budgets, active), [txns, budgets, active]);
  const overCount = rows.filter((r) => r.over).length;

  const totalBudget = rows.reduce((a, r) => a + r.budget, 0);
  const totalActual = rows.reduce((a, r) => a + r.actual, 0);

  return (
    <section id="budgets" className="panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Budget tracking</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={active}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setBudgets(suggestBudgets(txns))}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent"
          >
            <Wand2 className="h-3.5 w-3.5" /> Suggest from 3-mo average
          </button>
        </div>
      </div>

      {overCount > 0 && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {overCount} categor{overCount === 1 ? "y is" : "ies are"} over budget in{" "}
          {monthLabel(active)}.
        </p>
      )}

      <div className="space-y-4">
        {rows.map((r) => {
          const width = Math.min(r.pct, 100);
          return (
            <div key={r.category}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-medium">{r.category}</span>
                <span className="num text-muted-foreground">
                  {inr(r.actual)} /{" "}
                  <input
                    type="number"
                    value={r.budget || ""}
                    placeholder="set budget"
                    onChange={(e) =>
                      setBudgets({ ...budgets, [r.category]: Number(e.target.value) || 0 })
                    }
                    className="num w-28 rounded-md border border-input bg-background px-2 py-0.5 text-right text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
                  />
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full ${
                    r.over ? "bg-destructive" : r.pct > 85 ? "bg-warning" : "bg-primary"
                  }`}
                  style={{ width: `${r.budget ? width : 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {r.budget
                  ? r.over
                    ? `Over by ${inr(r.actual - r.budget)} (${r.pct.toFixed(0)}% of budget)`
                    : `${r.pct.toFixed(0)}% used · ${inr(r.budget - r.actual)} left`
                  : "No budget set"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex justify-between border-t border-border pt-3 text-xs">
        <span className="text-muted-foreground">Total {monthLabel(active)}</span>
        <span className="num font-semibold">
          {inr(totalActual)} / {inr(totalBudget)}
        </span>
      </div>
    </section>
  );
}
