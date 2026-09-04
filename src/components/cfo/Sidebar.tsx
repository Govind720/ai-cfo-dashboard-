import {
  Activity,
  BarChart3,
  FileText,
  LineChart,
  MessageSquare,
  PieChart,
  Scale,
  ShieldAlert,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";

const items = [
  { id: "briefing", label: "AI CFO Briefing", icon: Sparkles },
  { id: "overview", label: "Overview", icon: LineChart },
  { id: "trends", label: "Trends", icon: Activity },
  { id: "breakdown", label: "Category split", icon: PieChart },
  { id: "compare", label: "Year comparison", icon: BarChart3 },
  { id: "budgets", label: "Budgets", icon: Target },
  { id: "reports", label: "Export reports", icon: FileText },
  { id: "anomalies", label: "Anomalies", icon: ShieldAlert },
  { id: "compliance", label: "Compliance", icon: Scale },
  { id: "data", label: "Data & Import", icon: Upload },
  { id: "chat", label: "Ask the CFO", icon: MessageSquare },
];


export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-sm font-bold">₹</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-foreground">AI CFO</p>
          <p className="text-xs text-muted-foreground">Finance controller</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {items.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Icon className="h-4 w-4" />
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-auto rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3">
        <p className="text-xs font-medium text-sidebar-foreground">Powered by Gemini</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Categorization and analysis run server-side with a secured API key.
        </p>
      </div>
    </aside>
  );
}
