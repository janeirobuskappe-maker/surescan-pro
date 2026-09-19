"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calculator as CalcIcon,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Shuffle,
  Banknote,
  Percent,
  Scale,
  EyeOff,
  Info,
} from "lucide-react";
import { fmtFCFA, fmtNum } from "@/lib/types";

type Leg = { book: string; odds: string };

const PRESETS: { count: 2 | 3; legs: Leg[]; label: string }[] = [
  {
    label: "Football · 1X2",
    count: 3,
    legs: [
      { book: "1xBet", odds: "2.15" },
      { book: "Melbet", odds: "3.75" },
      { book: "BetWinner", odds: "4.10" },
    ],
  },
  {
    label: "Tennis · 1/2",
    count: 2,
    legs: [
      { book: "22Bet", odds: "2.06" },
      { book: "Linebet", odds: "1.98" },
    ],
  },
  {
    label: "Virtuel · +/− 2,5",
    count: 2,
    legs: [
      { book: "MegaPari", odds: "2.12" },
      { book: "1xBet", odds: "1.94" },
    ],
  },
];

const ROUND_STEPS = [1, 50, 100, 500, 1000];

export function Calculator() {
  const sp = useSearchParams();

  const initLegs: Leg[] = (() => {
    const fromUrl: Leg[] = [];
    for (let i = 1; i <= 3; i++) {
      const o = sp.get(`o${i}`);
      if (o) fromUrl.push({ book: sp.get(`b${i}`) ?? `Bookmaker ${i}`, odds: o });
    }
    return fromUrl.length >= 2 ? fromUrl : PRESETS[0].legs;
  })();

  const [count, setCount] = useState<2 | 3>(initLegs.length === 3 ? 3 : 2);
  const [legs, setLegs] = useState<Leg[]>(initLegs);
  const [stake, setStake] = useState<number>(Number(sp.get("stake")) || 100_000);
  const [rounding, setRounding] = useState(false);
  const [step, setStep] = useState(100);

  const setLeg = (i: number, patch: Partial<Leg>) =>
    setLegs((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const activeLegs = legs.slice(0, count);

  const result = useMemo(() => {
    const prices = activeLegs.map((l) => parseFloat(l.odds.replace(",", ".")));
    if (prices.some((p) => !isFinite(p) || p <= 1) || prices.length < 2) return null;
    const invSum = prices.reduce((s, p) => s + 1 / p, 0);
    const isArb = invSum < 1;
    const profitPct = (1 / invSum - 1) * 100;

    const exactStakes = prices.map((p) => (stake * (1 / p)) / invSum);
    let stakes = exactStakes;
    if (rounding) {
      stakes = exactStakes.map((s) => Math.max(step, Math.round(s / step) * step));
    }
    const totalStaked = stakes.reduce((a, b) => a + b, 0);
    const payouts = stakes.map((s, i) => s * prices[i]);
    const profits = payouts.map((p) => p - totalStaked);
    const minProfit = Math.min(...profits);
    const maxProfit = Math.max(...profits);
    const roiMin = (minProfit / totalStaked) * 100;

    return { prices, invSum, isArb, profitPct, stakes, exactStakes, totalStaked, payouts, profits, minProfit, maxProfit, roiMin };
  }, [activeLegs, stake, rounding, step]);

  const loadPreset = (p: (typeof PRESETS)[number]) => {
    setCount(p.count);
    setLegs(p.legs);
  };

  return (
    <div className="mx-auto w-full max-w-[1240px]">
      {/* En-tête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-mint">
            <CalcIcon className="size-3.5" />
            Outil professionnel
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Calculatrice de <span className="text-mint glow-mint">surebet</span>
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">
            Répartition optimale des mises pour un profit garanti quelle que soit
            l'issue du match. Formules exactes d'arbitrage, arrondi camouflage inclus.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => loadPreset(p)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500 transition-colors hover:border-mint/40 hover:text-mint"
            >
              <Shuffle className="size-3" />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {/* ------- Saisie ------- */}
        <div className="panel rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Issues du marché
            </p>
            <div className="flex overflow-hidden rounded-lg border border-slate-200">
              {([2, 3] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold ${
                    count === n ? "bg-emerald-50 text-mint" : "text-slate-400 hover:bg-slate-100"
                  }`}
                >
                  {n === 2 ? <Minus className="size-3" /> : <Plus className="size-3" />}
                  {n} issues
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {activeLegs.map((leg, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-black/25 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="num text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    Issue {i + 1}
                  </span>
                  <span className="num text-[10px] text-mint">
                    {result && isFinite(result.prices[i])
                      ? `prob. implicite ${fmtNum(100 / result.prices[i], 1)}%`
                      : "—"}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  <input
                    value={leg.book}
                    onChange={(e) => setLeg(i, { book: e.target.value })}
                    placeholder="Bookmaker"
                    className="field col-span-3 px-3 py-2.5 text-[13px] font-semibold text-slate-900 placeholder:text-slate-400"
                  />
                  <div className="field col-span-2 flex items-center px-3">
                    <span className="mr-1.5 text-[10px] font-bold text-slate-600">COTE</span>
                    <input
                      value={leg.odds}
                      onChange={(e) => setLeg(i, { odds: e.target.value })}
                      inputMode="decimal"
                      placeholder="2.10"
                      className="num w-full bg-transparent py-2.5 text-right text-[15px] font-bold text-mint placeholder:text-slate-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bankroll */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-black/25 p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                <Banknote className="size-3.5" /> Mise totale
              </p>
              <span className="num text-lg font-bold text-slate-900">{fmtFCFA(stake)}</span>
            </div>
            <input
              type="range"
              min={5000}
              max={2000000}
              step={5000}
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              className="slider mt-3 w-full"
              style={{ ["--fill" as string]: `${(stake / 2000000) * 100}%` }}
            />
            <div className="mt-1.5 flex justify-between text-[9px] font-semibold text-slate-600">
              <span>5 000</span>
              <span>2 000 000 FCFA</span>
            </div>
          </div>

          {/* Arrondi camouflage */}
          <div className="mt-3 rounded-xl border border-slate-200 bg-black/25 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <EyeOff className="size-3.5 text-amber" />
                Arrondi camouflage
              </p>
              <button
                onClick={() => setRounding((r) => !r)}
                className={`relative h-5.5 w-10 rounded-full transition-colors ${
                  rounding ? "bg-mint/80" : "bg-edge"
                }`}
                style={{ height: 22 }}
                aria-label="Basculer l'arrondi"
              >
                <span
                  className={`absolute top-[3px] size-4 rounded-full bg-white transition-all ${
                    rounding ? "left-[22px]" : "left-[3px]"
                  }`}
                />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
              Arrondit les mises pour passer inaperçu auprès des bookmakers (montants « naturels »).
            </p>
            {rounding && (
              <div className="mt-2.5 flex gap-1.5">
                {ROUND_STEPS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStep(s)}
                    className={`num rounded-md px-2 py-1 text-[10px] font-bold ${
                      step === s ? "bg-emerald-50 text-mint" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {s.toLocaleString("fr-FR")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ------- Résultats ------- */}
        <div className="space-y-4 lg:col-span-3">
          {/* Verdict */}
          <div
            className={`panel relative overflow-hidden rounded-2xl p-5 ${
              result?.isArb ? "border-mint/30" : "border-rose/25"
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-px ${
                result?.isArb
                  ? "bg-gradient-to-r from-transparent via-mint to-transparent"
                  : "bg-gradient-to-r from-transparent via-rose to-transparent"
              }`}
            />
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {result?.isArb ? (
                  <CheckCircle2 className="size-9 text-mint" />
                ) : (
                  <XCircle className="size-9 text-rose" />
                )}
                <div>
                  <p className="text-lg font-extrabold tracking-tight text-slate-900">
                    {result
                      ? result.isArb
                        ? "SUREBET DÉTECTÉ"
                        : "Pas d'arbitrage"
                      : "Saisissez des cotes valides"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {result
                      ? result.isArb
                        ? "Profit garanti quelle que soit l'issue du match."
                        : "La somme des probabilités implicites dépasse 100% — marge bookmaker."
                      : "Chaque cote doit être supérieure à 1.00."}
                  </p>
                </div>
              </div>
              {result && (
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Σ probabilités
                    </p>
                    <p
                      className={`num text-xl font-bold ${
                        result.isArb ? "text-mint" : "text-rose"
                      }`}
                    >
                      {fmtNum(result.invSum * 100, 2)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      {result.isArb ? "ROI garanti" : "Marge perdue"}
                    </p>
                    <p
                      className={`num glow-mint text-3xl font-extrabold ${
                        result.isArb ? "text-mint" : "text-rose"
                      }`}
                    >
                      {result.isArb ? "+" : ""}
                      {fmtNum(result.profitPct)}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Jauge */}
            {result && (
              <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-black/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    result.isArb
                      ? "bg-gradient-to-r from-mint-dim to-mint"
                      : "bg-gradient-to-r from-rose/60 to-rose"
                  }`}
                  style={{ width: `${Math.min(result.invSum * 100, 110) / 1.1}%` }}
                />
                <div className="absolute inset-y-0 left-[90.9%] w-px bg-white/50" />
              </div>
            )}
          </div>

          {/* Table de répartition */}
          {result && (
            <div className="panel overflow-hidden rounded-2xl">
              <div className="grid grid-cols-12 gap-2 border-b border-slate-200 px-5 py-3 text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                <span className="col-span-4 sm:col-span-3">Bookmaker</span>
                <span className="col-span-2 text-right">Cote</span>
                <span className="col-span-3 text-right sm:col-span-2">Mise</span>
                <span className="col-span-3 text-right sm:col-span-2">Retour</span>
                <span className="col-span-3 hidden text-right sm:block">Profit si gagné</span>
              </div>
              {activeLegs.map((leg, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 items-center gap-2 border-b border-slate-100 px-5 py-3.5"
                >
                  <div className="col-span-4 sm:col-span-3">
                    <p className="truncate text-[13px] font-bold text-slate-900">
                      {leg.book || `Bookmaker ${i + 1}`}
                    </p>
                    <div className="mt-1 h-1 w-full max-w-[120px] overflow-hidden rounded-full bg-edge/70">
                      <div
                        className="h-full rounded-full bg-mint"
                        style={{ width: `${(1 / result.prices[i] / result.invSum) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="num col-span-2 text-right text-[14px] font-bold text-mint">
                    {fmtNum(result.prices[i])}
                  </span>
                  <span className="num col-span-3 text-right text-[13px] font-bold text-slate-900 sm:col-span-2">
                    {fmtFCFA(result.stakes[i])}
                    {rounding && (
                      <span className="block text-[9px] font-medium text-slate-500">
                        exact : {fmtFCFA(result.exactStakes[i])}
                      </span>
                    )}
                  </span>
                  <span className="num col-span-3 text-right text-[13px] font-semibold text-slate-500 sm:col-span-2">
                    {fmtFCFA(result.payouts[i])}
                  </span>
                  <span
                    className={`num col-span-3 hidden text-right text-[13px] font-bold sm:block ${
                      result.profits[i] >= 0 ? "text-mint" : "text-rose"
                    }`}
                  >
                    {result.profits[i] >= 0 ? "+" : ""}
                    {fmtFCFA(result.profits[i])}
                  </span>
                </div>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <span className="num text-[11px] text-slate-500">
                  Total engagé :{" "}
                  <span className="font-bold text-slate-700">{fmtFCFA(result.totalStaked)}</span>
                </span>
                <span className="num flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Scale className="size-3.5 text-mint" />
                  Profit min / max :{" "}
                  <span className={`font-bold ${result.minProfit >= 0 ? "text-mint" : "text-rose"}`}>
                    {fmtFCFA(result.minProfit)}
                  </span>
                  /
                  <span className={`font-bold ${result.maxProfit >= 0 ? "text-mint" : "text-rose"}`}>
                    {fmtFCFA(result.maxProfit)}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Rappel théorique */}
          <div className="panel rounded-2xl p-5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              <Info className="size-3.5 text-mint" /> La théorie derrière l'outil
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-black/25 p-3.5">
                <p className="num text-[11px] font-bold text-mint">1. Détection</p>
                <p className="num mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  S = 1/cote₁ + 1/cote₂ (+1/cote₃)
                  <br />
                  S &lt; 1 ⇒ arbitrage possible
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-black/25 p-3.5">
                <p className="num text-[11px] font-bold text-mint">2. Répartition</p>
                <p className="num mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  miseᵢ = T × (1/coteᵢ) / S<br />
                  pour un retour identique
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-black/25 p-3.5">
                <p className="num text-[11px] font-bold text-mint">3. Profit</p>
                <p className="num mt-1.5 text-[11px] leading-relaxed text-slate-400">
                  P = T × (1/S − 1)
                  <br />
                  <Percent className="mr-1 inline size-3" />
                  garanti sur chaque issue
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
