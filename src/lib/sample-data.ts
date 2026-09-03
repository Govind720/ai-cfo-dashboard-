import type { Txn } from "./finance";

type Row = Omit<Txn, "id">;

const rows: Row[] = [];
let n = 0;
const push = (r: Row) => rows.push(r);

const months = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];

const salaries: Record<string, number> = {
  "2026-03": 1850000,
  "2026-04": 1850000,
  "2026-05": 1980000,
  "2026-06": 1980000,
  "2026-07": 2240000,
  "2026-08": 2240000,
};
const aws: Record<string, number> = {
  "2026-03": 312000,
  "2026-04": 348000,
  "2026-05": 361000,
  "2026-06": 402000,
  "2026-07": 918000, // July spike (load test + new region)
  "2026-08": 437000,
};
const marketing: Record<string, number> = {
  "2026-03": 420000,
  "2026-04": 465000,
  "2026-05": 510000,
  "2026-06": 495000,
  "2026-07": 1480000, // July spike (product launch campaign)
  "2026-08": 560000,
};
const revenue: Record<string, number> = {
  "2026-03": 2650000,
  "2026-04": 2810000,
  "2026-05": 3020000,
  "2026-06": 3180000,
  "2026-07": 3420000,
  "2026-08": 3740000,
};

for (const m of months) {
  push({
    date: `${m}-01`,
    description: "Monthly payroll disbursement",
    vendor: "RazorpayX Payroll",
    category: "Salaries",
    amount: salaries[m]!,
    type: "expense",
  });
  push({
    date: `${m}-05`,
    description: "AWS cloud infrastructure invoice",
    vendor: "Amazon Web Services",
    category: "Cloud Infrastructure",
    amount: aws[m]!,
    type: "expense",
  });
  push({
    date: `${m}-08`,
    description: "Performance marketing spend",
    vendor: "Google Ads",
    category: "Marketing",
    amount: Math.round(marketing[m]! * 0.6),
    type: "expense",
  });
  push({
    date: `${m}-09`,
    description: "Social campaign spend",
    vendor: "Meta Ads",
    category: "Marketing",
    amount: Math.round(marketing[m]! * 0.4),
    type: "expense",
  });
  push({
    date: `${m}-12`,
    description: "Office rent - Koramangala HQ",
    vendor: "Prestige Estates",
    category: "Rent",
    amount: 385000,
    type: "expense",
  });
  push({
    date: `${m}-15`,
    description: "GST payment for previous month",
    vendor: "GSTN Portal",
    category: "Taxes",
    amount: Math.round(revenue[m]! * 0.09),
    type: "expense",
  });
  push({
    date: `${m}-18`,
    description: "Razorpay payment gateway fees",
    vendor: "Razorpay",
    category: "Payment Processing",
    amount: Math.round(revenue[m]! * 0.021),
    type: "expense",
  });
  push({
    date: `${m}-20`,
    description: "SaaS subscriptions (Slack, Notion, Figma, Zoom)",
    vendor: "Multiple SaaS",
    category: "Software",
    amount: 148000 + n * 4000,
    type: "expense",
  });
  push({
    date: `${m}-22`,
    description: "Contract engineering & design",
    vendor: "Freelancers (Contra)",
    category: "Contractors",
    amount: 210000,
    type: "expense",
  });
  push({
    date: `${m}-25`,
    description: "Team travel & client meetings",
    vendor: "MakeMyTrip Business",
    category: "Travel",
    amount: 92000,
    type: "expense",
  });
  push({
    date: `${m}-28`,
    description: "SaaS subscription revenue collected",
    vendor: "Customer collections",
    category: "Revenue",
    amount: revenue[m]!,
    type: "income",
  });
  n++;
}

// Hidden duplicate: AWS July invoice paid twice
push({
  date: "2026-07-07",
  description: "AWS cloud infrastructure invoice",
  vendor: "Amazon Web Services",
  category: "Cloud Infrastructure",
  amount: aws["2026-07"]!,
  type: "expense",
});

// A couple of uncategorized rows for the AI categorizer
push({
  date: "2026-08-11",
  description: "Zoho Books annual accounting subscription",
  vendor: "Zoho",
  category: "",
  amount: 74000,
  type: "expense",
});
push({
  date: "2026-08-19",
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
