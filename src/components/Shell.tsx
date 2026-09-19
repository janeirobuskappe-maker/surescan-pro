"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Crosshair,
  LayoutDashboard,
  Calculator,
  Radar,
  Sigma,
  ShieldCheck,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Scanner live", icon: LayoutDashboard },
  { href: "/calculatrice", label: "Calculatrice", icon: Calculator },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px]">
      {/* ------- Sidebar ------- */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-slate-200/80 bg-white/90 px-5 py-6 shadow-sm backdrop-blur-xl lg:flex">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
            <Crosshair className="size-5 text-emerald-600 transition-transform duration-500 group-hover:rotate-90" />
            <span className="pulse-soft absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
          <span>
            <span className="block text-[15px] font-bold tracking-tight text-slate-900">
              SureScan<span className="text-emerald-600"> Pro</span>
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">
              Arbitrage · Gabon
            </span>
          </span>
        </Link>

        <nav className="mt-10 space-y-1.5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Navigation
          </p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm"
                    : "border border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon className={`size-[18px] ${active ? "text-emerald-600" : ""}`} />
                {label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-emerald-500" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <Sigma className="size-4" />
            <span className="text-xs font-semibold">Formule surebet</span>
          </div>
          <p className="mt-2 font-mono text-[12px] text-slate-600">
            Σ 1/cote<span className="text-slate-400">i</span> &lt; 1
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Surebet détecté lorsque la somme des probabilités implicites des
            meilleures cotes est inférieure à 100%.
          </p>
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-sm">
            <ShieldCheck className="size-4 text-emerald-600" />
            <div className="text-[11px] leading-tight">
              <p className="font-semibold text-slate-800">8 bookmakers suivis</p>
              <p className="text-slate-500">1xBet · Melbet · BetWinner…</p>
            </div>
          </div>
          <p className="px-1 text-[10px] leading-relaxed text-slate-400">
            Outil d&apos;analyse — pariez de manière responsable. 18+.
          </p>
        </div>
      </aside>

      {/* ------- Contenu ------- */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border border-emerald-200 bg-emerald-50">
              <Radar className="size-4 text-emerald-600" />
            </span>
            <span className="text-sm font-bold text-slate-900">
              SureScan<span className="text-emerald-600"> Pro</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="size-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
