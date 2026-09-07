"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconCompass, IconColumns, IconSparkle, IconWallet } from "@/components/icons";

const NAV = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/explore", label: "Explore", icon: IconCompass },
  { href: "/compare", label: "Compare", icon: IconColumns },
  { href: "/copilot", label: "Ask Copilot", icon: IconSparkle },
];


const DEMO_WALLET = "0x6528d5747Fc5eaAC19fe3F0882B475D3eE8E38ec";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <Link href="/" className="border-b border-slate-100 px-5 py-4 leading-tight">
        <div className="font-semibold text-slate-900">
          Agent<span className="text-blue-800">Hub</span>
        </div>
        <div className="text-[11px] text-slate-400">BNB Smart Chain</div>
      </Link>

      <nav className="flex flex-col gap-0.5 p-3 text-sm">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${
                isActive
                  ? "bg-blue-50 font-medium text-blue-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-blue-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div
        className="mx-3 mb-3 mt-auto flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
        title="Fixed demo session wallet used for Altana hires -- not a connected wallet"
      >
        <IconWallet className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="truncate font-mono">
          {DEMO_WALLET.slice(0, 6)}...{DEMO_WALLET.slice(-4)}
        </span>
      </div>
    </aside>
  );
}
