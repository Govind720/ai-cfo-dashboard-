import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";
import { askCfo } from "@/lib/ai.functions";

type Msg = { role: "user" | "assistant"; content: string };

const suggestions = [
  "Why did expenses spike in July?",
  "What's our runway?",
  "Where can we cut 10% of burn?",
  "Any duplicate or suspicious payments?",
];

export function ChatPanel({
  summary,
  disabled,
  pending,
}: {
  summary: string;
  disabled: boolean;
  pending?: { id: number; question: string } | null;
}) {
  const ask = useServerFn(askCfo);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const lastPending = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    if (!question.trim() || loading || disabled) return;
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await ask({ data: { question, summary, history } });
      setMessages((m) => [...m, { role: "assistant", content: res.answer }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!pending || pending.id === lastPending.current) return;
    lastPending.current = pending.id;
    void send(pending.question);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);


  return (
    <section id="chat" className="panel flex h-[620px] flex-col p-5">
      <header className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Ask the CFO</h2>
      </header>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            Ask anything about your finances — burn, runway, category drivers, anomalies.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                : "max-w-[92%] rounded-xl rounded-bl-sm border border-border bg-secondary/50 px-3 py-2 text-sm whitespace-pre-wrap text-foreground"
            }
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="max-w-[60%] rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
            Analyzing the ledger…
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            disabled={disabled || loading}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? "Load transactions first" : "Ask about your numbers…"}
          disabled={disabled || loading}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || loading}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-2 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
