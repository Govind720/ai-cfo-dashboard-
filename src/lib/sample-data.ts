import type { Txn } from "./finance";

type Row = Omit<Txn, "id">;

const rows: Row[] = [];
const push = (r: Row) => rows.push(r);

// Three Indian financial years: FY2023-24, FY2024-25, FY2025-26 (Apr -> Mar)
function fyMonths(startYear: number) {
  const out: string[] = [];
  for (let i = 0; i < 12; i++) {
    const m = 4 + i;
    const y = m > 12 ? startYear + 1 : startYear;
    const mm = ((m - 1) % 12) + 1;
    out.push(`${y}-${String(mm).padStart(2, "0")}`);
  }
  return out;
}

const months = [...fyMonths(2023), ...fyMonths(2024), ...fyMonths(2025)];

const round = (n: number) => Math.round(n / 1000) * 1000;

months.forEach((m, i) => {
  const monthNum = Number(m.slice(5, 7));
  const isJuly = monthNum === 7;
  const growth = Math.pow(1.031, i); // steady compounding scale-up

  const salaries = round(1120000 * growth * (monthNum === 4 ? 1.06 : 1)); // appraisals in April
  const cloud = round(210000 * growth * (isJuly ? 2.4 : 1)); // July load-test + new region
  const marketingTotal = round(280000 * growth * (isJuly ? 2.8 : monthNum === 10 ? 1.4 : 1)); // July launch, Oct festive
  const revenue = round(1750000 * Math.pow(1.036, i) * (monthNum === 10 ? 1.12 : 1));
  const rent = round(240000 * Math.pow(1.0045, i));

  push({
    date: `${m}-01`,
    description: "Monthly payroll disbursement",
    vendor: "RazorpayX Payroll",
    category: "Salaries",
    amount: salaries,
    type: "expense",
  });
  push({
    date: `${m}-05`,
    description: "AWS cloud infrastructure invoice",
    vendor: "Amazon Web Services",
    category: "Cloud Infrastructure",
    amount: cloud,
    type: "expense",
  });
  push({
    date: `${m}-08`,
    description: "Performance marketing spend",
    vendor: "Google Ads",
    category: "Marketing",
    amount: round(marketingTotal * 0.6),
    type: "expense",
  });
  push({
    date: `${m}-09`,
    description: "Social campaign spend",
    vendor: "Meta Ads",
    category: "Marketing",
    amount: round(marketingTotal * 0.4),
    type: "expense",
  });
  push({
    date: `${m}-12`,
    description: "Office rent - Koramangala HQ",
    vendor: "Prestige Estates",
    category: "Rent",
    amount: rent,
    type: "expense",
  });
  push({
    date: `${m}-15`,
    description: "GST payment for previous month",
    vendor: "GSTN Portal",
    category: "Taxes",
    amount: round(revenue * 0.09),
    type: "expense",
  });
  push({
    date: `${m}-18`,
    description: "Razorpay payment gateway fees",
    vendor: "Razorpay",
    category: "Payment Processing",
    amount: round(revenue * 0.021),
    type: "expense",
  });
  push({
    date: `${m}-20`,
    description: "SaaS subscriptions (Slack, Notion, Figma, Zoom)",
    vendor: "Multiple SaaS",
    category: "Software",
    amount: round(88000 + i * 3200),
    type: "expense",
  });
  push({
    date: `${m}-22`,
    description: "Contract engineering & design",
    vendor: "Freelancers (Contra)",
    category: "Contractors",
    amount: round(130000 * growth),
    type: "expense",
  });
  push({
    date: `${m}-25`,
    description: "Team travel & client meetings",
    vendor: "MakeMyTrip Business",
    category: "Travel",
    amount: round(58000 * growth * (monthNum === 1 || monthNum === 9 ? 1.7 : 1)),
    type: "expense",
  });
  push({
    date: `${m}-28`,
    description: "SaaS subscription revenue collected",
    vendor: "Customer collections",
    category: "Revenue",
    amount: revenue,
    type: "income",
  });

  // Hidden duplicate: AWS July invoice paid twice in the latest financial year
  if (isJuly && m.startsWith("2025")) {
    push({
      date: `${m}-07`,
      description: "AWS cloud infrastructure invoice",
      vendor: "Amazon Web Services",
      category: "Cloud Infrastructure",
      amount: cloud,
      type: "expense",
    });
  }
});

// A couple of uncategorized rows for the AI categorizer
push({
  date: "2026-02-11",
  description: "Zoho Books annual accounting subscription",
  vendor: "Zoho",
  category: "",
  amount: 74000,
  type: "expense",
});
push({
  date: "2026-02-19",
  description: "Employee health insurance premium",
  vendor: "ICICI Lombard",
  category: "",
  amount: 168000,
  type: "expense",
});

export const SAMPLE_CASH = 24500000;

export const sampleTransactions: Txn[] = rows
  .map((r, i) => ({ ...r, id: `sample-${i}` }))
  .sort((a, b) => a.date.localeCompare(b.date));
