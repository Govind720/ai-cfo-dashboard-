import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { inr, inrCompact, type Analytics } from "@/lib/finance";

const palette = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const compact = inrCompact;


function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel px-3 py-2 text-xs">
      <p className="font-medium text-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="num mt-1 text-muted-foreground">
          {p.name}: <span className="text-foreground">{inr(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function TopCategoriesChart({ data }: { data: Analytics["topCategories"] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} stroke="var(--color-border)" />
        <XAxis
          type="number"
          tickFormatter={compact}
          stroke="var(--color-muted-foreground)"
          fontSize={11}
        />
        <YAxis
          type="category"
          dataKey="category"
          width={120}
          stroke="var(--color-muted-foreground)"
          fontSize={11}
        />
        <Tooltip cursor={{ fill: "var(--color-accent)" }} content={<ChartTooltip />} />
        <Bar dataKey="total" name="Spend" radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ExpenseTrendChart({ data }: { data: Analytics["months"] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ left: 8, right: 16, top: 8 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} />
        <YAxis tickFormatter={compact} stroke="var(--color-muted-foreground)" fontSize={11} />
        <Tooltip content={<ChartTooltip />} />
        <Line
          type="monotone"
          dataKey="expense"
          name="Expenses"
          stroke="var(--color-chart-5)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="income"
          name="Income"
          stroke="var(--color-chart-1)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({
  data,
}: {
  data: { category: string; total: number }[];
}) {
  const total = data.reduce((a, d) => a + d.total, 0) || 1;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          innerRadius={62}
          outerRadius={104}
          paddingAngle={2}
          stroke="var(--color-card)"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }: any) => {
            if (!active || !payload?.length) return null;
            const p = payload[0];
            return (
              <div className="panel px-3 py-2 text-xs">
                <p className="font-medium text-foreground">{p.name}</p>
                <p className="num mt-1 text-muted-foreground">
                  {inr(p.value)} · {((p.value / total) * 100).toFixed(1)}%
                </p>
              </div>
            );
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={48}
          wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function YearComparisonChart({
  rows,
  years,
}: {
  rows: Record<string, number | string>[];
  years: string[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={rows} margin={{ left: 8, right: 16, top: 8 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
        <YAxis tickFormatter={compact} stroke="var(--color-muted-foreground)" fontSize={11} />
        <Tooltip content={<ChartTooltip />} />
        <Legend
          verticalAlign="top"
          height={28}
          wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }}
        />
        {years.map((y, i) => (
          <Line
            key={y}
            type="monotone"
            dataKey={y}
            name={y}
            stroke={palette[i % palette.length]!}
            strokeWidth={2}
            dot={{ r: 2.5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
