import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  Database,
  Flame,
  Sparkles,
  Timer,
  Upload,
  Wallet,
} from "lucide-react";
import { Sidebar } from "@/components/cfo/Sidebar";
import {
  CategoryPieChart,
  ExpenseTrendChart,
  TopCategoriesChart,
} from "@/components/cfo/Charts";
import { ChatPanel } from "@/components/cfo/ChatPanel";
import { Comparison } from "@/components/cfo/Comparison";
import { Budgets } from "@/components/cfo/Budgets";
import { Reports } from "@/components/cfo/Reports";
import { categorizeTransactions } from "@/lib/ai.functions";
import { SAMPLE_CASH, sampleTransactions } from "@/lib/sample-data";
import { analyze, buildSummary, inr, parseCsv, type Txn } from "@/lib/finance";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI CFO — AI Finance Controller Dashboard" },
      {
        name: "description",
        content:
          "Upload transactions, auto-categorize with AI, and track burn rate, runway, expense trends and flagged anomalies in one CFO dashboard.",
      },
      { property: "og:title", content: "AI CFO — AI Finance Controller Dashboard" },
      {
        property: "og:description",
        content:
          "Burn rate, cash runway, expense trends, anomaly detection and an AI CFO chat over your transaction data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [cash, setCash] = useState(SAMPLE_CASH);
  const [status, setStatus] = useState<string | null>(null);
  const [categorizing, setCategorizing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const categorize = useServerFn(categorizeTransactions);

  const a = useMemo(() => analyze(txns, cash), [txns, cash]);
  const summary = useMemo(() => (txns.length ? buildSummary(a, txns) : ""), [a, txns]);
  const hasData = txns.length > 0;

  async function onFile(file: File) {
    const rows = parseCsv(await file.text());
    if (!rows.length) {
      setStatus("Could not read that CSV. Expected columns: date, description, vendor, category, amount, type.");
      return;
    }
    setTxns(rows);
    setStatus(`Imported ${rows.length} transactions from ${file.name}.`);
  }

  async function runCategorize() {
    const pending = a.uncategorized;
    if (!pending.length) {
      setStatus("All transactions are already categorized.");
      return;
    }
    setCategorizing(true);
    setStatus(null);
    try {
      const known = [...new Set(txns.map((t) => t.category).filter(Boolean))];
      const res = await categorize({
        data: {
          items: pending.slice(0, 100).map((t) => ({
            id: t.id,
            description: t.description,
            vendor: t.vendor,
            amount: t.amount,
            type: t.type,
          })),
          categories: known,
        },
      });
      const map = new Map(res.results.map((r) => [r.id, r.category]));
      setTxns((cur) => cur.map((t) => (map.has(t.id) ? { ...t, category: map.get(t.id)! } : t)));
      setStatus(`AI categorized ${map.size} transaction${map.size === 1 ? "" : "s"}.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Categorization failed.");
    } finally {
      setCategorizing(false);
    }
  }

  const runway = Number.isFinite(a.runwayMonths) ? `${a.runwayMonths.toFixed(1)} mo` : "∞";
  const lastMonth = a.months.at(-1);
  const prevMonth = a.months.at(-2);
  const momChange =
    lastMonth && prevMonth && prevMonth.expense
      ? ((lastMonth.expense - prevMonth.expense) / prevMonth.expense) * 100
      : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 px-5 py-7 lg:px-9">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">AI CFO</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your always-on finance controller — burn, runway, anomalies and answers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFile(f);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Upload className="h-4 w-4" /> Upload CSV
            </button>
            <button
              onClick={() => {
                setTxns(sampleTransactions);
                setCash(SAMPLE_CASH);
                setStatus(`Loaded ${sampleTransactions.length} sample transactions.`);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Database className="h-4 w-4" /> Load sample data
            </button>
            <button
              onClick={runCategorize}
              disabled={!hasData || categorizing}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" />
              {categorizing ? "Categorizing…" : `Auto-categorize (${a.uncategorized.length})`}
            </button>
          </div>
        </header>

        {status && (
          <p className="mt-4 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
            {status}
          </p>
        )}

        {!hasData ? (
          <div className="panel mt-8 flex flex-col items-center justify-center px-6 py-20 text-center">
            <Wallet className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">No transactions yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Upload a CSV with columns <span className="num">date, description, vendor,
              category, amount, type</span> — or load realistic sample data for an Indian startup.
            </p>
          </div>
        ) : (
          <>
            <section id="overview" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                icon={<Flame className="h-4 w-4 text-destructive" />}
                label="Monthly burn (3-mo avg)"
                value={inr(Math.round(a.burnRate))}
                hint="Net cash out per month"
              />
              <Stat
                icon={<Timer className="h-4 w-4 text-primary" />}
                label="Cash runway"
                value={runway}
                hint={`At ${inr(Math.round(a.burnRate))}/mo burn`}
              />
              <Stat
                icon={<Wallet className="h-4 w-4 text-primary" />}
                label="Cash balance"
                value={inr(cash)}
                hint={
                  <input
                    type="number"
                    value={cash}
                    onChange={(e) => setCash(Number(e.target.value) || 0)}
                    className="num mt-1 w-full rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                  />
                }
              />
              <Stat
                icon={
                  momChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-primary" />
                  )
                }
                label="Expenses MoM"
                value={`${momChange >= 0 ? "+" : ""}${momChange.toFixed(1)}%`}
                hint={lastMonth ? `${lastMonth.label}: ${inr(lastMonth.expense)}` : ""}
              />
            </section>

            <section id="trends" className="mt-6 grid gap-4 xl:grid-cols-2">
              <Panel title="Top 5 expense categories">
                <TopCategoriesChart data={a.topCategories} />
              </Panel>
              <Panel title="Month-over-month trend">
                <ExpenseTrendChart data={a.months} />
              </Panel>
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_1fr]">
              <div className="space-y-4">
                <Panel
                  title={`Flagged anomalies (${a.anomalies.length})`}
                  id="anomalies"
                  icon={<AlertTriangle className="h-4 w-4 text-warning" />}
                >
                  {a.anomalies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No duplicates or outliers detected.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {a.anomalies.map((x) => (
                        <li
                          key={x.id}
                          className="flex gap-3 rounded-lg border border-border bg-secondary/40 p-3"
                        >
                          <div className="mt-0.5">
                            {x.kind === "duplicate" ? (
                              <Copy className="h-4 w-4 text-warning" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{x.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{x.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>

                <Panel title={`Transactions (${txns.length})`} id="data">
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-card text-muted-foreground">
                        <tr>
                          <th className="py-2 pr-3 font-medium">Date</th>
                          <th className="py-2 pr-3 font-medium">Vendor</th>
                          <th className="py-2 pr-3 font-medium">Category</th>
                          <th className="py-2 pr-3 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {txns.map((t) => (
                          <tr key={t.id} className="border-t border-border">
                            <td className="num py-2 pr-3 text-muted-foreground">{t.date}</td>
                            <td className="py-2 pr-3">
                              {t.vendor}
                              <span className="block text-muted-foreground">{t.description}</span>
                            </td>
                            <td className="py-2 pr-3">
                              <span className="rounded-full border border-border px-2 py-0.5">
                                {t.category?.trim() || "Uncategorized"}
                              </span>
                            </td>
                            <td
                              className={`num py-2 pr-1 text-right ${t.type === "income" ? "text-primary" : "text-foreground"}`}
                            >
                              {t.type === "income" ? "+" : "-"}
                              {inr(t.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>

              <ChatPanel summary={summary} disabled={!hasData} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="num mt-3 text-2xl font-semibold">{value}</p>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function Panel({
  title,
  children,
  id,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
  icon?: React.ReactNode;
}) {
  return (
    <section id={id} className="panel p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
