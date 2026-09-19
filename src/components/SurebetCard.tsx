"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Volleyball,
  Trophy,
  Timer,
  Zap,
  ArrowUpRight,
  Clock3,
  CircleDollarSign,
} from "lucide-react";
import type { SurebetDTO } from "@/lib/types";
import { fmtFCFA, fmtNum } from "@/lib/types";
import { marketLabel } from "@/lib/arbitrage";

function useNow(stepMs = 30_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(t);
  }, [stepMs]);
  return now;
}

function formatCountdown(startsAt: string, now: number | null) {
  const t = new Date(startsAt).getTime();
  if (now === null) return { label: "…", soon: false };
  const diff = t - now;
  if (diff <= 0) return { label: "Démarré", soon: true };
  const min = Math.floor(diff / 60000);
  if (min < 60) return { label: `dans ${min} min`, soon: min <= 30 };
  const h = Math.floor(min / 60);
  if (h < 24) return { label: `dans ${h} h ${String(min % 60).padStart(2, "0")}`, soon: false };
  const d = Math.floor(h / 24);
  return { label: `dans ${d} j ${h % 24} h`, soon: false };
}

function formatStart(startsAt: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startsAt));
}

const SPORT_ICON: Record<string, typeof Volleyball> = {
  football: Volleyball,
  tennis: Trophy,
  basketball: Timer,
};

const SPORT_LABEL: Record<string, string> = {
  football: "Football",
  tennis: "Tennis",
  basketball: "Basket",
};

export function SurebetCard({
  sb,
  bankroll,
  index,
}: {
  sb: SurebetDTO;
  bankroll: number;
  index: number;
}) {
  const now = useNow();
  const countdown = formatCountdown(sb.event.startsAt, now);
  const SportIcon = SPORT_ICON[sb.event.sport] ?? Volleyball;
  const isVirtual = sb.kind === "virtual";
  const market = sb.market.split(":")[0];
  const ouLine = sb.market.includes(":") ? sb.market.split(":")[1] : null;

  const calcParams = new URLSearchParams();
  sb.legs.forEach((l, i) => {
    calcParams.set(`o${i + 1}`, String(l.price));
    calcParams.set(`b${i + 1}`, l.bookmakerName);
  });
  calcParams.set("stake", String(Math.round(bankroll)));

  const profitFcfa = bankroll * (sb.profitPct / 100);

  return (
    <article
      className="panel card-lift fade-up relative overflow-hidden rounded-2xl"
      style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
    >
      {/* liseré supérieur */}
      <div
        className={`absolute inset-x-0 top-0 h-px ${
          isVirtual
            ? "bg-gradient-to-r from-transparent via-azure/70 to-transparent"
            : "bg-gradient-to-r from-transparent via-mint/70 to-transparent"
        }`}
      />

      <div className="p-5">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={`grid size-9 shrink-0 place-items-center rounded-lg border ${
                isVirtual
                  ? "border-azure/25 bg-azure/10 text-azure"
                  : "border-mint/25 bg-mint/10 text-mint"
              }`}
            >
              <SportIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {sb.event.league}
              </p>
              <p className="text-[10px] font-medium text-slate-600">
                {SPORT_LABEL[sb.event.sport] ?? sb.event.sport}
                {ouLine ? ` · Ligne ${ouLine}` : ""}
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] ${
              isVirtual
                ? "border-azure/30 bg-azure/10 text-azure"
                : "border-mint/30 bg-mint/10 text-mint"
            }`}
          >
            {isVirtual ? "Virtuel" : "Réel"}
          </span>
        </div>

        {/* Profit héros */}
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="num glow-mint text-[38px] font-bold leading-none text-mint">
              +{fmtNum(sb.profitPct)}
              <span className="text-lg">%</span>
            </p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Zap className="size-3 text-mint" />
              Profit garanti · Σ {fmtNum(sb.invSum, 4)}
            </p>
          </div>
          <div className="pb-1 text-right">
            <p className="flex items-center justify-end gap-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
              <Clock3 className="size-3" /> Coup d'envoi
            </p>
            <p
              className={`num mt-0.5 text-[13px] font-bold ${
                countdown.soon ? "text-amber" : "text-slate-500"
              }`}
            >
              {countdown.label}
            </p>
            <p className="text-[10px] text-slate-600">{formatStart(sb.event.startsAt)}</p>
          </div>
        </div>

        {/* Match */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-black/30 px-4 py-3.5">
          <p className="truncate text-[15px] font-bold tracking-tight text-slate-900">
            {sb.event.home}
          </p>
          <p className="my-1 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
            vs
          </p>
          <p className="truncate text-[15px] font-bold tracking-tight text-slate-900">
            {sb.event.away}
          </p>
        </div>

        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {ouLine ? marketLabel(market) : marketLabel(market)}
        </p>

        {/* Pattes de l'arbitrage */}
        <div className="mt-2 space-y-1.5">
          {sb.legs.map((leg) => {
            const stake = bankroll * leg.stakeFraction;
            return (
              <div
                key={`${leg.outcome}-${leg.bookmakerSlug}`}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2.5"
              >
                <span
                  className="grid h-7 w-[86px] shrink-0 place-items-center rounded-md px-1.5 text-[9.5px] font-extrabold uppercase tracking-wide"
                  style={{ background: leg.bookmakerColor, color: leg.bookmakerTextColor }}
                >
                  <span className="truncate">{leg.bookmakerName}</span>
                </span>
                <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-slate-500">
                  {leg.outcomeLabel}
                </span>
                <span className="num rounded-md border border-mint/25 bg-emerald-50 px-2 py-1 text-[13px] font-bold text-mint">
                  {fmtNum(leg.price)}
                </span>
                <span className="num hidden w-[92px] text-right text-[11px] font-semibold text-slate-400 sm:block">
                  {fmtFCFA(stake)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Pied */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <CircleDollarSign className="size-3.5 text-mint" />
            <span className="num font-semibold text-slate-500">{fmtFCFA(profitFcfa)}</span>
            <span>garantis / {fmtFCFA(bankroll)}</span>
          </p>
          <Link
            href={`/calculatrice?${calcParams.toString()}`}
            className="group flex items-center gap-1 rounded-lg border border-mint/25 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-mint transition-all hover:bg-emerald-50"
          >
            Calculer
            <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
