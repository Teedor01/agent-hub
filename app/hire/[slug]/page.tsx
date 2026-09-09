"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DataSource } from "@/types/domain";
import type { TaskResult } from "@/lib/tasks/types";
import type { VenusHealthOutput } from "@/lib/tasks/venus-health";
import type { VenusYieldOutput } from "@/lib/tasks/venus-yield";
import type { PancakeGridOutput } from "@/lib/tasks/pancake-grid";

const TASK_ENABLED_SLUGS = new Set(["agentcensus-health-factor-monitor"]);


const YIELD_TASK_ENABLED_SLUGS = new Set(["stableyield"]);


const GRID_TASK_ENABLED_SLUGS = new Set(["rangebot"]);

interface AgentAltanaConfig {
  id: string;
  name: string;
  dataSource: DataSource;
  erc8004Verified: boolean;
  altanaEnabled: boolean;
  altanaContractLabel: string | null;
  altanaSpendCapWei: string | null;
  altanaSessionDurationSeconds: number | null;
}

interface HireResult {
  id: string;
  status: "SIMULATED" | "ONCHAIN";
  txHash: string | null;
  altanaSessionId?: string | null;
  altanaWalletAddress?: string | null;
  spendCapWei?: string | null;
  sessionExpiresAt?: string | null;
  revokedAt?: string | null;
}

function weiToBnb(wei: string | null | undefined): string {
  if (!wei) return "—";
  return (Number(BigInt(wei)) / 1e18).toString();
}

function secondsToDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""}`;
  const hours = Math.floor(seconds / 3600);
  return `${hours} hour${hours !== 1 ? "s" : ""}`;
}


function TaskComputationPanel({ slug }: { slug: string }) {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<TaskResult<VenusHealthOutput> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runTask() {
    setStatus("loading");
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/tasks/${slug}/execute`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Task request failed");
        setStatus("idle");
        return;
      }
      setResult(data as TaskResult<VenusHealthOutput>);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Task request failed");
      setStatus("idle");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50/40 p-6">
      <h2 className="text-sm font-semibold text-purple-900">Task Computation</h2>
      <p className="mt-1 text-xs text-purple-800">
        Separate from onchain permissioned execution above... this makes real, free reads against
        Venus Protocol on BSC testnet to compute an actual account health report. No transaction,
        no spend, no Altana session involved.
      </p>

      <label className="mt-4 block text-xs font-medium text-purple-900">Wallet address (task input)</label>
      <input
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
        placeholder="0x..."
        className="mt-1 w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
      />
      <button
        onClick={runTask}
        disabled={status === "loading" || !wallet}
        className="mt-3 w-full rounded-lg bg-purple-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-900 disabled:opacity-50"
      >
        {status === "loading" ? "Running…" : "Run Task"}
      </button>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
      )}

      {result && (
        <div className="mt-4 space-y-3 text-xs">
          <div className="rounded-lg border border-purple-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">Execution status</span>
              <span
                className={
                  result.status === "SUCCESS"
                    ? "font-semibold text-emerald-700"
                    : result.status === "NO_POSITION"
                    ? "font-semibold text-amber-700"
                    : "font-semibold text-red-700"
                }
              >
                {result.status}
              </span>
            </div>
            <div className="mt-2 text-slate-600">Wallet: <code>{wallet}</code></div>
            {result.message && <div className="mt-1 text-slate-700">{result.message}</div>}
          </div>

          {result.output && (
            <div className="rounded-lg border border-purple-200 bg-white p-3">
              <div className="font-medium text-slate-900">Result (Venus native signal)</div>
              <div className="mt-1 grid grid-cols-2 gap-2 text-slate-700">
                <div>Liquidity: <span className="font-mono">{result.output.liquidity}</span></div>
                <div>Shortfall: <span className="font-mono">{result.output.shortfall}</span></div>
              </div>
              <div className="mt-2 text-slate-500 italic">{result.output.derivedRiskRatio.note}</div>

              {result.output.markets.length > 0 && (
                <div className="mt-3">
                  <div className="font-medium text-slate-900">Markets</div>
                  <div className="mt-1 space-y-1">
                    {result.output.markets.map((m) => (
                      <div key={m.vTokenAddress} className="rounded border border-slate-200 p-2">
                        <div className="font-mono text-slate-500">{m.vTokenAddress}</div>
                        <div>
                          {m.underlyingSymbol}: supplied {m.suppliedUnderlying}, borrowed {m.borrowedUnderlying}, collateral
                          factor {m.collateralFactorPct}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {result.dataSources.length > 0 && (
            <div className="rounded-lg border border-purple-200 bg-white p-3">
              <div className="font-medium text-slate-900">Data sources</div>
              <div className="mt-1 text-slate-600">
                Block {result.dataSources[0].blockNumber} · {result.dataSources[0].timestamp}
              </div>
              <div className="mt-2 space-y-1">
                {result.dataSources.map((ds, i) => (
                  <div key={i} className="font-mono text-[11px] text-slate-500">
                    {ds.functionCalled}{ds.address ? ` @ ${ds.address}` : ""}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function YieldTaskComputationPanel({ slug }: { slug: string }) {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<TaskResult<VenusYieldOutput> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runTask() {
    setStatus("loading");
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/tasks/${slug}/execute`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Task request failed");
        setStatus("idle");
        return;
      }
      setResult(data as TaskResult<VenusYieldOutput>);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Task request failed");
      setStatus("idle");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50/40 p-6">
      <h2 className="text-sm font-semibold text-purple-900">Task Computation</h2>
      <p className="mt-1 text-xs text-purple-800">
        Separate from onchain permissioned execution above... compares real Venus API market data
        against this wallet&apos;s real onchain Venus position. No transaction, no spend, no Altana
        session involved.
      </p>

      <label className="mt-4 block text-xs font-medium text-purple-900">Wallet address (task input)</label>
      <input
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
        placeholder="0x..."
        className="mt-1 w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
      />
      <button
        onClick={runTask}
        disabled={status === "loading" || !wallet}
        className="mt-3 w-full rounded-lg bg-purple-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-900 disabled:opacity-50"
      >
        {status === "loading" ? "Running…" : "Run Task"}
      </button>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
      )}

      {result && (
        <div className="mt-4 space-y-3 text-xs">
          <div className="rounded-lg border border-purple-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">Execution status</span>
              <span
                className={
                  result.status === "SUCCESS"
                    ? "font-semibold text-emerald-700"
                    : result.status === "NO_POSITION"
                    ? "font-semibold text-amber-700"
                    : "font-semibold text-red-700"
                }
              >
                {result.status}
              </span>
            </div>
            <div className="mt-2 text-slate-600">Wallet: <code>{wallet}</code></div>
            {result.message && <div className="mt-1 text-slate-700">{result.message}</div>}
          </div>

          {result.output && (
            <>
              <div className="rounded-lg border border-purple-200 bg-white p-3">
                <div className="font-medium text-slate-900">Current position</div>
                {result.output.currentPosition ? (
                  <div className="mt-1 text-slate-700">
                    {result.output.currentPosition.underlyingSymbol}: supplied{" "}
                    {result.output.currentPosition.suppliedUnderlying}, borrowed{" "}
                    {result.output.currentPosition.borrowedUnderlying} -- current supply APY{" "}
                    {result.output.currentPosition.currentSupplyApyPercent}
                    {result.output.currentPosition.currentSupplyApyPercent !== "unavailable" ? "%" : ""}
                    {!result.output.currentPosition.collateralEnabled && (
                      <span className="ml-1 text-amber-700">(collateral not enabled)</span>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-slate-500 italic">No current position in a compared stablecoin market.</div>
                )}
              </div>

              <div className="rounded-lg border border-purple-200 bg-white p-3">
                <div className="font-medium text-slate-900">Opportunity comparison (Venus API data)</div>
                <div className="mt-1 space-y-1">
                  {result.output.candidateMarkets.map((m) => (
                    <div key={m.vTokenAddress} className="rounded border border-slate-200 p-2">
                      <div className="font-mono text-slate-500">{m.vTokenAddress}</div>
                      <div>
                        {m.underlyingSymbol}: supply APY {m.supplyApyPercent}
                        {m.supplyApyPercent !== "unavailable" ? "%" : ""} · borrow APY {m.borrowApyPercent}
                        {m.borrowApyPercent !== "unavailable" ? "%" : ""}
                      </div>
                    </div>
                  ))}
                  {result.output.candidateMarkets.length === 0 && (
                    <div className="text-slate-500 italic">No Core-pool stablecoin markets found.</div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-purple-200 bg-white p-3">
                <div className="font-medium text-slate-900">Recommendation</div>
                {result.output.recommendation.bestOpportunity ? (
                  <div className="mt-1 text-slate-700">
                    Best available: {result.output.recommendation.bestOpportunity.underlyingSymbol} at{" "}
                    {result.output.recommendation.bestOpportunity.supplyApyPercent}% supply APY. Difference vs current:{" "}
                    {result.output.recommendation.apyDifferencePercent}
                    {result.output.recommendation.apyDifferencePercent !== "unavailable" ? " pp" : ""}
                  </div>
                ) : (
                  <div className="mt-1 text-slate-500 italic">No opportunity with usable APY data found.</div>
                )}
                <div className="mt-2 text-slate-500 italic">{result.output.recommendation.note}</div>
              </div>
            </>
          )}

          {result.dataSources.length > 0 && (
            <div className="rounded-lg border border-purple-200 bg-white p-3">
              <div className="font-medium text-slate-900">Data sources</div>
              <div className="mt-2 space-y-1">
                {result.dataSources.map((ds, i) => (
                  <div key={i} className="font-mono text-[11px] text-slate-500">
                    {ds.functionCalled}
                    {ds.address ? ` @ ${ds.address}` : ""}
                    {ds.blockNumber ? ` (block ${ds.blockNumber})` : ""} · {ds.timestamp}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function GridTaskComputationPanel({ slug }: { slug: string }) {
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<TaskResult<PancakeGridOutput> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runTask() {
    setStatus("loading");
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/tasks/${slug}/execute`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: wallet || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Task request failed");
        setStatus("idle");
        return;
      }
      setResult(data as TaskResult<PancakeGridOutput>);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Task request failed");
      setStatus("idle");
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50/40 p-6">
      <h2 className="text-sm font-semibold text-purple-900">Task Computation</h2>
      <p className="mt-1 text-xs text-purple-800">
        Separate from onchain permissioned execution above. This performs real, free reads against
        PancakeSwap/BSC Testnet to calculate a grid trading setup. No transaction, no spend, no
        Altana session is required.
      </p>

      <label className="mt-4 block text-xs font-medium text-purple-900">
        Wallet address (optional -- not used in this calculation)
      </label>
      <input
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
        placeholder="0x... (optional)"
        className="mt-1 w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
      />
      <button
        onClick={runTask}
        disabled={status === "loading"}
        className="mt-3 w-full rounded-lg bg-purple-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-900 disabled:opacity-50"
      >
        {status === "loading" ? "Running…" : "Run Task"}
      </button>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</div>
      )}

      {result && (
        <div className="mt-4 space-y-3 text-xs">
          <div className="rounded-lg border border-purple-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">Execution status</span>
              <span
                className={
                  result.status === "SUCCESS"
                    ? "font-semibold text-emerald-700"
                    : result.status === "NO_POSITION"
                    ? "font-semibold text-amber-700"
                    : "font-semibold text-red-700"
                }
              >
                {result.status}
              </span>
            </div>
            {result.message && <div className="mt-1 text-slate-700">{result.message}</div>}
          </div>

          {result.output && (
            <>
              <div className="rounded-lg border border-purple-200 bg-white p-3">
                <div className="font-medium text-slate-900">Grid Setup Analysis</div>
                <div className="mt-1 text-slate-700">
                  Pair: {result.output.pair.token0Symbol}/{result.output.pair.token1Symbol}
                </div>
                <div className="font-mono text-[11px] text-slate-500">{result.output.pair.pairAddress}</div>
                <div className="mt-2 text-slate-700">
                  Current price: {result.output.currentPrice} {result.output.pair.token1Symbol} per{" "}
                  {result.output.pair.token0Symbol}
                </div>
                <div className="mt-1 text-slate-700">
                  Grid range: {result.output.lowerBound} - {result.output.upperBound} (
                  {result.output.assumptions.gridRangePercent}% band)
                </div>
                <div className="mt-1 text-slate-700">
                  {result.output.gridCount} levels, spacing {result.output.spacing}
                </div>
                <div className="mt-2 space-y-0.5">
                  {result.output.gridLevels.map((lvl) => (
                    <div key={lvl.index} className="font-mono text-slate-600">
                      L{lvl.index}: {lvl.price}
                    </div>
                  ))}
                </div>
                <div className="mt-2 space-y-1 text-slate-500 italic">
                  <div>{result.output.assumptions.formulaCurrentPrice}</div>
                  <div>{result.output.assumptions.formulaGridRange}</div>
                  <div>{result.output.assumptions.formulaGridLevels}</div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <div className="font-medium">Important note</div>
                <div className="mt-1">
                  This is a grid configuration mechanically derived from current onchain reserves...
                  it is NOT a guarantee of profit, historical backtesting, a live trade, or a
                  completed trading strategy.
                </div>
              </div>
            </>
          )}

          {result.dataSources.length > 0 && (
            <div className="rounded-lg border border-purple-200 bg-white p-3">
              <div className="font-medium text-slate-900">Data Provenance</div>
              <div className="mt-2 space-y-1">
                {result.dataSources.map((ds, i) => (
                  <div key={i} className="font-mono text-[11px] text-slate-500">
                    {ds.functionCalled}
                    {ds.address ? ` @ ${ds.address}` : ""}
                    {ds.blockNumber ? ` (block ${ds.blockNumber})` : ""} · {ds.timestamp}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HirePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [agentConfig, setAgentConfig] = useState<AgentAltanaConfig | null>(null);
  const [status, setStatus] = useState<"loading-agent" | "idle" | "loading" | "done" | "error">("loading-agent");
  const [hire, setHire] = useState<HireResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    fetch(`/api/agents/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setAgentConfig(data);
        setStatus("idle");
      });
  }, [slug]);

  async function confirmHire() {
    if (!agentConfig) return;
    setStatus("loading");
    setErrorMsg(null);
    const res = await fetch("/api/hire", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agentId: agentConfig.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? "Hire failed");
      setStatus("error");
      return;
    }
    setHire(data.hire);
    setStatus("done");
  }

  async function revoke() {
    if (!hire) return;
    setRevoking(true);
    const res = await fetch("/api/hire/revoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hireId: hire.id }),
    });
    const data = await res.json();
    setRevoking(false);
    if (res.ok) {
      setHire(data.hire);
    } else {
      setErrorMsg(data.error ?? "Revoke failed");
    }
  }

  const isReal = hire?.status === "ONCHAIN";
  const willBeReal = agentConfig?.altanaEnabled;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-lg px-6 py-16">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          {status === "loading-agent" && <p className="text-sm text-slate-500">Loading…</p>}

          {(status === "idle" || status === "loading" || status === "error") && agentConfig && (
            <>
              <h1 className="text-lg font-semibold text-slate-900">Hire {agentConfig.name}</h1>
              <div className="mt-2">
                <DataSourceBadge source={agentConfig.dataSource} />
              </div>

              {willBeReal && agentConfig.dataSource !== "VERIFIED_ONCHAIN" && agentConfig.dataSource !== "VERIFIED_EXTERNAL" && (
                <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-3 text-xs text-slate-700">
                  <strong>Two separate things are true here:</strong> the hiring transaction below is
                  real (a genuine Altana session on BNB testnet). This agent&apos;s marketplace
                  data... execution history, metrics, creator identity... is demo data, not a
                  verified track record. A real execution pathway does not mean this agent has real
                  onchain history.
                </div>
              )}

              {willBeReal ? (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
                  <p className="font-medium text-blue-900">This agent can:</p>
                  <ul className="mt-2 space-y-1 text-blue-800">
                    <li>✓ Interact with {agentConfig.altanaContractLabel ?? "one scoped contract"}</li>
                    <li>✓ Nothing outside that single allowed contract</li>
                  </ul>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-blue-100 pt-3">
                    <div>
                      <div className="text-xs text-blue-700">Spend limit</div>
                      <div className="font-medium text-blue-900">{weiToBnb(agentConfig.altanaSpendCapWei)} BNB</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-700">Session duration</div>
                      <div className="font-medium text-blue-900">{secondsToDuration(agentConfig.altanaSessionDurationSeconds)}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-blue-900">
                    Approving grants a real, limited, revocable Altana session on BNB testnet... not a
                    simulation. You can revoke this at any time after hiring.
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <strong>This is a simulated hire.</strong> No real transaction, wallet approval, or
                  onchain activity occurs.
                </div>
              )}

              {status === "error" && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={confirmHire}
                disabled={status === "loading"}
                className="mt-5 w-full rounded-lg bg-blue-800 px-5 py-3 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-50"
              >
                {status === "loading" ? "Processing…" : willBeReal ? "Approve & Hire" : "Confirm simulated hire"}
              </button>
            </>
          )}

          {status === "done" && (
            <>
              <h1 className="text-lg font-semibold text-slate-900">
                {agentConfig?.name}{" "}
                {isReal ? (
                  hire?.revokedAt ? (
                    <span className="text-red-600">● Revoked</span>
                  ) : (
                    <span className="text-emerald-600">● Active</span>
                  )
                ) : (
                  "(simulated)"
                )}
              </h1>
              {agentConfig && (
                <div className="mt-2">
                  <DataSourceBadge source={agentConfig.dataSource} />
                </div>
              )}

              {isReal && agentConfig?.dataSource !== "VERIFIED_ONCHAIN" && agentConfig?.dataSource !== "VERIFIED_EXTERNAL" && (
                <div className="mt-3 rounded-lg border border-slate-300 bg-slate-50 p-3 text-xs text-slate-700">
                  The transaction below is a real onchain Altana session... not simulated. This
                  agent&apos;s marketplace metrics are demo data. Real execution infrastructure,
                  demo agent history: these are independent facts.
                </div>
              )}

              {isReal ? (
                <div className="mt-4 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <div>
                    Session expires:{" "}
                    {hire?.sessionExpiresAt ? new Date(hire.sessionExpiresAt).toLocaleString() : "—"}
                  </div>
                  <div>Spend limit: {weiToBnb(hire?.spendCapWei)} BNB</div>
                  <div>Wallet: <code>{hire?.altanaWalletAddress}</code></div>
                  <div>Transaction: <code>{hire?.txHash}</code></div>
                  {hire?.revokedAt ? (
                    <div className="font-medium text-red-700">Revoked at {new Date(hire.revokedAt).toLocaleString()}</div>
                  ) : (
                    <button
                      onClick={revoke}
                      disabled={revoking}
                      className="mt-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {revoking ? "Revoking…" : "Revoke Access"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  Status: <span className="font-medium text-amber-700">SIMULATED</span> -- no onchain
                  transaction hash exists for this hire.
                </div>
              )}

              {errorMsg && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              <Link href="/" className="mt-5 inline-block text-sm text-blue-800 hover:underline">
                Back to marketplace
              </Link>
            </>
          )}
        </div>

        {TASK_ENABLED_SLUGS.has(slug) && <TaskComputationPanel slug={slug} />}
        {YIELD_TASK_ENABLED_SLUGS.has(slug) && <YieldTaskComputationPanel slug={slug} />}
        {GRID_TASK_ENABLED_SLUGS.has(slug) && <GridTaskComputationPanel slug={slug} />}
      </div>
    </main>
  );
}
