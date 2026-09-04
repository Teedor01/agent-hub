"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AgentSummary, RecommendationEvidence } from "@/types/domain";

interface CopilotResponse {
  message: string;
  evidence: RecommendationEvidence[];
  agents: AgentSummary[];
}

export default function CopilotPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [text, setText] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopilotResponse | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  async function ask(query: string) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: query }),
      });
      const data = await res.json();
      setResult(data);
      setSelected([]);
    } finally {
      setLoading(false);
    }
  }

 
  useEffect(() => {
    let cancelled = false;
    if (initialQuery.trim()) {
      (async () => {
        if (!cancelled) await ask(initialQuery);
      })();
    }
    return () => {
      cancelled = true;
    };
    
  }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-3)));
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-slate-900">AgentHub Copilot</h1>
        <p className="mt-1 text-sm text-slate-500">Describe what you want to accomplish.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) ask(text);
          }}
          className="mt-6 flex gap-2"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. I want to optimize my stablecoin yield"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-800 px-5 py-3 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </form>

        {result && (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-700">{result.message}</p>
            </div>

            {result.agents.length > 0 && (
              <>
                <div>
                  <h2 className="mb-3 text-sm font-medium text-slate-500">
                    Ranked candidates — select up to 3 to compare
                  </h2>
                  <div className="space-y-3">
                    {result.agents
                      .slice()
                      .sort(
                        (a, b) =>
                          (result.evidence.find((e) => e.agentId === b.id)?.score ?? 0) -
                          (result.evidence.find((e) => e.agentId === a.id)?.score ?? 0)
                      )
                      .map((agent) => {
                        const ev = result.evidence.find((e) => e.agentId === agent.id);
                        const isSelected = selected.includes(agent.id);
                        return (
                          <div
                            key={agent.id}
                            className={`flex items-start gap-3 rounded-xl border p-4 ${
                              isSelected ? "border-blue-600 bg-blue-50/40" : "border-slate-200 bg-white"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(agent.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <Link href={`/agents/${agent.slug}`} className="font-medium text-slate-900 hover:text-blue-800">
                                  {agent.name}
                                </Link>
                                <span className="text-sm font-medium text-slate-500">{ev?.score}/100</span>
                              </div>
                              {ev && ev.reasons.length > 0 && (
                                <p className="mt-1 text-xs text-emerald-700">{ev.reasons.join(" · ")}</p>
                              )}
                              {ev && ev.tradeoffs.length > 0 && (
                                <p className="mt-0.5 text-xs text-amber-700">{ev.tradeoffs.join(" · ")}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {selected.length >= 2 && (
                  <Link
                    href={`/compare?ids=${selected.join(",")}`}
                    className="inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Compare selected ({selected.length})
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
