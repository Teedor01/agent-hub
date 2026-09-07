import { DataSource } from "@/types/domain";



const CONFIG: Record<DataSource, { label: string; className: string }> = {
  VERIFIED_ONCHAIN: {
    label: "Verified on-chain",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  VERIFIED_EXTERNAL: {
    label: "Verified (8004scan)",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  MARKETPLACE_DERIVED: {
    label: "AgentHub-computed",
    className: "bg-blue-50 text-blue-900 border-blue-200",
  },
  SELF_REPORTED: {
    label: "Self-reported",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  DEMO: {
    label: "Demo data",
    className: "bg-slate-100 text-slate-600 border-slate-300",
  },
};

export function DataSourceBadge({ source }: { source: DataSource }) {
  const c = CONFIG[source];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}
