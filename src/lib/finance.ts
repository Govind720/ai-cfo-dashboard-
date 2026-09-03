export type Txn = {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  vendor: string;
  category: string;
  amount: number;
  type: "income" | "expense";
};

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const monthKey = (d: string) => d.slice(0, 7);

export const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, 1).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  });
};

export function parseCsv(text: string): Txn[] {
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  const clean = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (clean.length < 2) return [];
  const header = clean[0]!.map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const out: Txn[] = [];
  clean.slice(1).forEach((r, i) => {
    const get = (n: string) => (idx(n) >= 0 ? (r[idx(n)] ?? "").trim() : "");
    const rawAmount = get("amount").replace(/[₹,\s]/g, "");
    const amount = Math.abs(Number(rawAmount));
    if (!Number.isFinite(amount)) return;
    const typeRaw = get("type").toLowerCase();
    out.push({
      id: `csv-${i}-${Math.random().toString(36).slice(2, 8)}`,
      date: normalizeDate(get("date")),
      description: get("description"),
      vendor: get("vendor"),
      category: get("category"),
      amount,
      type: typeRaw.startsWith("in") ? "income" : "expense",
    });
  });
  return out.filter((t) => t.date);
}

function normalizeDate(d: string): string {
  const s = d.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export type Anomaly = {
  id: string;
  kind: "duplicate" | "outlier";
  title: string;
  detail: string;
  amount: number;
  date: string;
};

export type Analytics = ReturnType<typeof analyze>;

export function analyze(txns: Txn[], cashBalance: number) {
  const months = Array.from(new Set(txns.map((t) => monthKey(t.date)))).sort();

  const byMonth = months.map((m) => {
    const rows = txns.filter((t) => monthKey(t.date) === m);
    const expense = sum(rows.filter((t) => t.type === "expense"));
    const income = sum(rows.filter((t) => t.type === "income"));
    return { month: m, label: monthLabel(m), expense, income, net: income - expense };
  });

  const recent = byMonth.slice(-3);
  const burnRate = recent.length
    ? recent.reduce((a, m) => a + Math.max(m.expense - m.income, 0), 0) / recent.length
    : 0;
  const runwayMonths = burnRate > 0 ? cashBalance / burnRate : Infinity;

  const catTotals = new Map<string, number>();
  txns
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const c = t.category?.trim() || "Uncategorized";
      catTotals.set(c, (catTotals.get(c) ?? 0) + t.amount);
    });
  const topCategories = [...catTotals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const totalExpense = sum(txns.filter((t) => t.type === "expense"));
  const totalIncome = sum(txns.filter((t) => t.type === "income"));

  return {
    months: byMonth,
    burnRate,
    runwayMonths,
    cashBalance,
    topCategories,
    totalExpense,
    totalIncome,
    anomalies: detectAnomalies(txns),
    uncategorized: txns.filter((t) => !t.category?.trim() || t.category.trim() === "Uncategorized"),
  };
}

function sum(rows: Txn[]) {
  return rows.reduce((a, t) => a + t.amount, 0);
}

export function detectAnomalies(txns: Txn[]): Anomaly[] {
  const out: Anomaly[] = [];

  // duplicates: same vendor + amount within 5 days
  const expenses = txns.filter((t) => t.type === "expense");
  for (let i = 0; i < expenses.length; i++) {
    for (let j = i + 1; j < expenses.length; j++) {
      const a = expenses[i]!;
      const b = expenses[j]!;
      if (a.vendor.toLowerCase() !== b.vendor.toLowerCase()) continue;
      if (Math.abs(a.amount - b.amount) > 0.01) continue;
      const days = Math.abs(+new Date(a.date) - +new Date(b.date)) / 86400000;
      if (days > 5) continue;
      out.push({
        id: `dup-${a.id}-${b.id}`,
        kind: "duplicate",
        title: `Possible duplicate payment to ${a.vendor}`,
        detail: `${inr(a.amount)} paid twice (${a.date} and ${b.date}) — "${b.description}"`,
        amount: a.amount,
        date: b.date,
      });
    }
  }

  // outliers vs category average
  const byCat = new Map<string, Txn[]>();
  expenses.forEach((t) => {
    const c = t.category?.trim() || "Uncategorized";
    byCat.set(c, [...(byCat.get(c) ?? []), t]);
  });
  byCat.forEach((rows, cat) => {
    if (rows.length < 4) return;
    const avg = sum(rows) / rows.length;
    rows.forEach((t) => {
      if (t.amount > avg * 2.5) {
        out.push({
          id: `out-${t.id}`,
          kind: "outlier",
          title: `Unusually large ${cat} payment`,
          detail: `${t.vendor} — ${inr(t.amount)} vs ${cat} average of ${inr(avg)} (${(t.amount / avg).toFixed(1)}x)`,
          amount: t.amount,
          date: t.date,
        });
      }
    });
  });

  return out.sort((a, b) => b.amount - a.amount);
}

export function buildSummary(a: Analytics, txns: Txn[]) {
  const lines: string[] = [];
  lines.push(`Cash balance: ${inr(a.cashBalance)}`);
  lines.push(`Average monthly net burn (last 3 months): ${inr(Math.round(a.burnRate))}`);
  lines.push(
    `Runway: ${Number.isFinite(a.runwayMonths) ? a.runwayMonths.toFixed(1) + " months" : "profitable / no burn"}`,
  );
  lines.push(`Total income: ${inr(a.totalIncome)} | Total expense: ${inr(a.totalExpense)}`);
  lines.push("");
  lines.push("Monthly totals (income / expense / net):");
  a.months.forEach((m) =>
    lines.push(`- ${m.label}: ${inr(m.income)} / ${inr(m.expense)} / ${inr(m.net)}`),
  );
  lines.push("");
  lines.push("Top expense categories (all time):");
  a.topCategories.forEach((c) => lines.push(`- ${c.category}: ${inr(c.total)}`));
  lines.push("");
  lines.push("Category totals by month:");
  const grid = new Map<string, Map<string, number>>();
  txns
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const c = t.category?.trim() || "Uncategorized";
      const m = grid.get(c) ?? new Map<string, number>();
      m.set(monthKey(t.date), (m.get(monthKey(t.date)) ?? 0) + t.amount);
      grid.set(c, m);
    });
  grid.forEach((m, c) => {
    const parts = [...m.entries()].sort().map(([k, v]) => `${monthLabel(k)} ${inr(v)}`);
    lines.push(`- ${c}: ${parts.join(", ")}`);
  });
  lines.push("");
  lines.push("Flagged anomalies:");
  if (!a.anomalies.length) lines.push("- none");
  a.anomalies.forEach((x) => lines.push(`- [${x.kind}] ${x.title}: ${x.detail}`));
  lines.push("");
  lines.push(`Largest 15 expenses:`);
  [...txns]
    .filter((t) => t.type === "expense")
    .sort((x, y) => y.amount - x.amount)
    .slice(0, 15)
    .forEach((t) =>
      lines.push(`- ${t.date} ${t.vendor} (${t.category}) ${inr(t.amount)} — ${t.description}`),
    );
  return lines.join("\n");
}
