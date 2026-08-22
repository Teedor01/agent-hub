"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { DataSource } from "@/types/domain";

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
                  data; execution history, metrics, creator identity... is demo data, not a
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
                      <div className="text-xs text-blue-500">Spend limit</div>
                      <div className="font-medium text-blue-900">{weiToBnb(agentConfig.altanaSpendCapWei)} BNB</div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-500">Session duration</div>
                      <div className="font-medium text-blue-900">{secondsToDuration(agentConfig.altanaSessionDurationSeconds)}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-blue-700">
                    Approving grants a real, limited, revocable Altana session on BNB testnet, not a
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
                className="mt-5 w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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

              <Link href="/" className="mt-5 inline-block text-sm text-blue-600 hover:underline">
                Back to marketplace
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
