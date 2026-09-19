"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Banknote,
  Gauge,
  Radar,
  RefreshCw,
  SlidersHorizontal,
  Target,
  TrendingUp,
  MonitorPlay,
  Globe2,
  Frown,
} from "lucide-react";
import type { StatsDTO, SurebetDTO } from "@/lib/types";
import { fmtNum } from "@/lib/types";
import { SurebetCard } from "@/components/SurebetCard";
import { Sparkline } from "@/components/Sparkline";

type Filters = {
  kind: "all" | "real" | "virtual";
  sport: string;
  market: string;
  minProfit: number;
  sort: "profit" | "recent" | "start";
};

const BANKROLLS = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "mint",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  sub: string;
  tone?: "mint" | "amber" | "azure" | "rose";
}) {
  const tones: Record<string, string> = {
    mint: "text-mint border-mint/25 bg-mint/10",
    amber: "text-amber border-amber/25 bg-amber/10",
    azure: "text-azure border-azure/25 bg-azure/10",
    rose: "text-rose border-rose/25 bg-rose/10",
  };
  return (
    <div className="panel flex items-center gap-3.5 rounded-2xl px-4 py-4">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl border ${tones[tone]}`}>
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="num truncate text-xl font-bold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <p className="truncate text-[10px] text-slate-600">{sub}</p>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [surebets, setSurebets] = useState<SurebetDTO[]>([]);
  const [stats, setStats] = useState<StatsDTO | null>(null);
  const [filters, setFilters] = useState<Filters>({
    kind: "all",
    sport: "all",
    market: "all",
    minProfit: 0,
    sort: "profit",
  });
  const [bankroll, setBankroll] = useState(100_000);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const busy = useRef(false);

  const fetchAll = useCallback(
    async (f: Filters) => {
      if (busy.current) return;
      busy.current = true;
      try {
        const params = new URLSearchParams({
          kind: f.kind,
          sport: f.sport,
          market: f.market,
          minProfit: String(f.minProfit),
          sort: f.sort,
          limit: "90",
        });
        const [r1, r2] = await Promise.all([
          fetch(`/api/surebets?${params}`, { cache: "no-store" }),
          fetch("/api/stats", { cache: "no-store" }),
        ]);
        const d1 = await r1.json();
        const d2 = await r2.json();
        setSurebets(d1.surebets ?? []);
        setStats(d2);
        setLastRefresh(new Date());
      } catch {
        /* silencieux */
      } finally {
        busy.current = false;
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    setLoading(true);
    fetchAll(filters);
  }, [filters, fetchAll]);

  useEffect(() => {
    const t = setInterval(() => fetchAll(filters), 12_000);
    return () => clearInterval(t);
  }, [filters, fetchAll]);

  const triggerScan = async () => {
    setScanning(true);
    try {
      await fetch("/api/scan", { method: "POST" });
      busy.current = false;
      await fetchAll(filters);
    } finally {
      setScanning(false);
    }
  };

  const spark7 = useMemo(
    () => (stats?.scanHistory ?? []).slice(-18).map((s) => s.found),
    [stats],
  );

  const maxHits = Math.max(...(stats?.byBookmaker ?? []).map((b) => b.hits), 1);
  const bookColor = (slug: string) =>
    stats?.bookmakers.find((b) => b.slug === slug)?.color ?? "#35ffb2";

  return (
    <div className="mx-auto w-full max-w-[1240px]">
      {/* ---------- En-tête ---------- */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-mint">
            <Radar className="size-3.5" />
            Surveillance en direct · Afrique centrale
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Scanner de <span className="text-mint glow-mint">surebets</span>
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">
            Détection algorithmique d'arbitrage sur les cotes de{" "}
            <span className="font-semibold text-slate-700">1xBet, Melbet, BetWinner, 22Bet, Premier Bet</span>{" "}
            et d'autres bookmakers — matchs réels & virtuels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="field flex items-center gap-2 px-3 py-2">
            <Banknote className="size-4 text-mint" />
            <select
              value={bankroll}
              onChange={(e) => setBankroll(Number(e.target.value))}
              className="num cursor-pointer bg-transparent text-[13px] font-bold text-slate-900 outline-none [&>option]:bg-white"
            >
              {BANKROLLS.map((b) => (
                <option key={b} value={b}>
                  {new Intl.NumberFormat("fr-FR").format(b)} FCFA
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={triggerScan}
            disabled={scanning}
            className="group flex items-center gap-2 rounded-xl bg-mint px-4 py-2 text-[13px] font-extrabold text-white shadow-md shadow-emerald-200/50 transition-all hover:brightness-110 disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${scanning ? "animate-spin" : "transition-transform group-hover:rotate-180"}`} />
            {scanning ? "Scan en cours…" : "Lancer un scan"}
          </button>
        </div>
      </div>

      {/* ---------- Bandeau statut ---------- */}
      <div className="panel mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl px-4 py-3">
        <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-mint">
          <span className="pulse-soft size-2 rounded-full bg-mint shadow-sm" />
          Flux temps réel
        </span>
        <span className="num text-[11px] text-slate-400">
          {stats?.upcomingEvents ?? "—"} événements sous surveillance
        </span>
        <span className="num text-[11px] text-slate-400">
          {stats ? stats.scanHistory.at(-1)?.durationMs ?? 0 : 0} ms / cycle de scan
        </span>
        <span className="num ml-auto text-[11px] text-slate-500" suppressHydrationWarning>
          {lastRefresh
            ? `MAJ ${lastRefresh.toLocaleTimeString("fr-FR")} · auto 12 s`
            : "Initialisation…"}
        </span>
      </div>

      {/* ---------- Statistiques ---------- */}
      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile
          icon={Target}
          label="Surebets actifs"
          value={String(stats?.activeSurebets ?? "—")}
          sub={`${stats?.activeReal ?? 0} réels · ${stats?.activeVirtual ?? 0} virtuels`}
        />
        <StatTile
          icon={TrendingUp}
          label="Profit moyen"
          value={stats ? `+${fmtNum(stats.avgProfit)}%` : "—"}
          sub="par opportunité active"
          tone="azure"
        />
        <StatTile
          icon={Gauge}
          label="Meilleure marge"
          value={stats ? `+${fmtNum(stats.bestProfit)}%` : "—"}
          sub="surebet le plus rentable"
          tone="amber"
        />
        <StatTile
          icon={Activity}
          label="Détectés au total"
          value={String(stats?.totalDetected ?? "—")}
          sub="depuis le démarrage"
          tone="rose"
        />
      </div>

      {/* ---------- Graphiques ---------- */}
      <div className="mt-3 grid gap-3 lg:grid-cols-5">
        <div className="panel rounded-2xl p-4 lg:col-span-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Surebets détectés par cycle
            </p>
            <span className="num text-[10px] text-slate-600">
              {spark7.length ? `Σ ${spark7.reduce((a, b) => a + b, 0)} sur ${spark7.length} scans` : ""}
            </span>
          </div>
          <div className="mt-3">
            <Sparkline points={spark7} width={680} height={86} />
          </div>
        </div>
        <div className="panel rounded-2xl p-4 lg:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Bookmakers impliqués
          </p>
          <div className="mt-3 space-y-2">
            {(stats?.byBookmaker ?? []).slice(0, 6).map((b) => (
              <div key={b.slug} className="flex items-center gap-2.5">
                <span
                  className="w-[74px] truncate text-[10.5px] font-bold"
                  style={{ color: bookColor(b.slug) }}
                >
                  {b.name}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(b.hits / maxHits) * 100}%`,
                      background: bookColor(b.slug),
                    }}
                  />
                </div>
                <span className="num w-7 text-right text-[11px] font-bold text-slate-500">
                  {b.hits}
                </span>
              </div>
            ))}
            {(stats?.byBookmaker ?? []).length === 0 && (
              <p className="text-[11px] text-slate-600">Aucune donnée pour le moment.</p>
            )}
          </div>
        </div>
      </div>

      {/* ---------- Filtres ---------- */}
      <div className="panel mt-6 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <SlidersHorizontal className="size-3.5" /> Filtres
          </span>

          <div className="flex overflow-hidden rounded-lg border border-slate-200">
            {(
              [
                ["all", "Tous", Globe2],
                ["real", "Réels", Activity],
                ["virtual", "Virtuels", MonitorPlay],
              ] as const
            ).map(([v, label, Icon]) => (
              <button
                key={v}
                onClick={() => setFilters((f) => ({ ...f, kind: v }))}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-bold transition-colors ${
                  filters.kind === v
                    ? "bg-emerald-50 text-mint"
                    : "text-slate-400 hover:bg-slate-100"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          <select
            value={filters.sport}
            onChange={(e) => setFilters((f) => ({ ...f, sport: e.target.value }))}
            className="field num cursor-pointer px-3 py-2 text-[11px] font-bold text-slate-700 outline-none [&>option]:bg-white"
          >
            <option value="all">Tous les sports</option>
            <option value="football">Football</option>
            <option value="tennis">Tennis</option>
            <option value="basketball">Basketball</option>
          </select>

          <select
            value={filters.market}
            onChange={(e) => setFilters((f) => ({ ...f, market: e.target.value }))}
            className="field num cursor-pointer px-3 py-2 text-[11px] font-bold text-slate-700 outline-none [&>option]:bg-white"
          >
            <option value="all">Tous les marchés</option>
            <option value="1X2">Résultat 1X2</option>
            <option value="OU25">+/− 2,5 buts</option>
            <option value="BTTS">Les 2 équipes marquent</option>
            <option value="12">Vainqueur (1/2)</option>
            <option value="OU2">Total points</option>
          </select>

          <select
            value={filters.sort}
            onChange={(e) =>
              setFilters((f) => ({ ...f, sort: e.target.value as Filters["sort"] }))
            }
            className="field num cursor-pointer px-3 py-2 text-[11px] font-bold text-slate-700 outline-none [&>option]:bg-white"
          >
            <option value="profit">Tri : profit ↓</option>
            <option value="recent">Tri : récents</option>
            <option value="start">Tri : coup d'envoi</option>
          </select>

          <div className="flex items-center gap-2.5">
            <span className="num whitespace-nowrap text-[11px] font-bold text-slate-400">
              ≥ {fmtNum(filters.minProfit, 1)}%
            </span>
            <input
              type="range"
              min={0}
              max={6}
              step={0.5}
              value={filters.minProfit}
              onChange={(e) => setFilters((f) => ({ ...f, minProfit: Number(e.target.value) }))}
              className="slider w-28"
              style={{ ["--fill" as string]: `${(filters.minProfit / 6) * 100}%` }}
            />
          </div>

          <span className="num ml-auto text-[11px] font-bold text-slate-500">
            {surebets.length} opportunité{surebets.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ---------- Grille ---------- */}
      {loading && surebets.length === 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel shimmer h-[380px] rounded-2xl" />
          ))}
        </div>
      ) : surebets.length === 0 ? (
        <div className="panel mt-6 grid place-items-center rounded-2xl px-6 py-20 text-center">
          <Frown className="size-8 text-slate-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            Aucune opportunité ne correspond aux filtres
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
            Réduisez le profit minimum, élargissez les marchés ou lancez un nouveau scan —
            les cotes évoluent en permanence.
          </p>
          <button
            onClick={triggerScan}
            className="mt-5 flex items-center gap-2 rounded-xl bg-mint px-4 py-2 text-[12px] font-extrabold text-white"
          >
            <RefreshCw className="size-4" /> Scanner maintenant
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {surebets.map((sb, i) => (
            <SurebetCard key={sb.id} sb={sb} bankroll={bankroll} index={i} />
          ))}
        </div>
      )}

      {/* ---------- Ticker ---------- */}
      {surebets.length > 0 && (
        <div className="panel mt-6 overflow-hidden rounded-xl">
          <div className="ticker-track flex w-max items-center gap-8 px-6 py-2.5">
            {[...surebets.slice(0, 12), ...surebets.slice(0, 12)].map((sb, i) => (
              <span
                key={`${sb.id}-${i}`}
                className="num flex items-center gap-2 whitespace-nowrap text-[11px] text-slate-400"
              >
                <span className="font-bold text-mint">+{fmtNum(sb.profitPct)}%</span>
                {sb.event.home} × {sb.event.away}
                <span className="text-slate-600">via {sb.legs.map((l) => l.bookmakerName).join(" · ")}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
