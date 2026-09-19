import type { ArbLeg } from "@/db/schema";

/**
 * Moteur de détection d'arbitrage (surebet).
 *
 * Principe mathématique :
 * Pour un marché à N issues, un surebet existe lorsque la somme des
 * probabilités implicites des MEILLEURES cotes de chaque issue est < 1 :
 *
 *      S = Σ (1 / meilleureCote_i)  <  1
 *
 * Marge bénéficiaire garantie :  P = (1/S − 1) × 100  (%)
 * Répartition optimale des mises pour une bankroll T :
 *      mise_i = T × (1/cote_i) / S
 * Gain constant quelle que soit l'issue : G = T / S
 */

export type Offer = {
  outcome: string;
  bookmakerSlug: string;
  bookmakerName: string;
  bookmakerColor: string;
  bookmakerTextColor: string;
  price: number;
};

export type ArbResult = {
  isArb: boolean;
  invSum: number;
  profitPct: number;
  legs: ArbLeg[];
};

const OUTCOME_LABELS: Record<string, string> = {
  "1": "Victoire domicile (1)",
  X: "Match nul (X)",
  "2": "Victoire extérieur (2)",
  over: "Plus de 2,5 buts",
  under: "Moins de 2,5 buts",
  yes: "Les deux équipes marquent",
  no: "Une équipe ne marque pas",
};

export function outcomeLabel(outcome: string): string {
  return OUTCOME_LABELS[outcome] ?? outcome;
}

/**
 * Détecte un arbitrage à partir des offres groupées par issue.
 * `byOutcome[i]` = liste des cotes proposées par chaque bookmaker pour l'issue i.
 * Pour chaque issue on retient la meilleure cote (la plus haute).
 */
export function detectArbitrage(byOutcome: Offer[][]): ArbResult {
  const best = byOutcome.map((offers) =>
    offers.reduce((a, b) => (b.price > a.price ? b : a)),
  );

  const invSum = best.reduce((s, o) => s + 1 / o.price, 0);
  const isArb = invSum < 1;
  const profitPct = isArb ? (1 / invSum - 1) * 100 : 0;

  const legs: ArbLeg[] = best.map((o) => ({
    outcome: o.outcome,
    outcomeLabel: outcomeLabel(o.outcome),
    bookmakerSlug: o.bookmakerSlug,
    bookmakerName: o.bookmakerName,
    bookmakerColor: o.bookmakerColor,
    bookmakerTextColor: o.bookmakerTextColor,
    price: o.price,
    stakeFraction: isArb ? 1 / o.price / invSum : 0,
  }));

  return { isArb, invSum, profitPct, legs };
}

export type StakeLine = {
  stake: number;
  payout: number;
  profit: number;
};

/**
 * Répartition des mises pour une bankroll totale donnée.
 * Garantit le même gain quelle que soit l'issue gagnante.
 */
export function computeStakes(
  prices: number[],
  total: number,
): { lines: StakeLine[]; invSum: number; profitPct: number; payout: number } {
  const invSum = prices.reduce((s, p) => s + 1 / p, 0);
  const payout = total / invSum;
  const lines = prices.map((p) => {
    const stake = (total * (1 / p)) / invSum;
    return { stake, payout: stake * p, profit: stake * p - total };
  });
  const profitPct = (1 / invSum - 1) * 100;
  return { lines, invSum, profitPct, payout };
}

export const MARKET_LABELS: Record<string, string> = {
  "1X2": "Résultat final (1X2)",
  OU25: "Total buts +/− 2,5",
  BTTS: "Les deux équipes marquent",
  "12": "Vainqueur du match (1/2)",
  OU2: "Total points +/− ligne",
};

export function marketLabel(m: string): string {
  return MARKET_LABELS[m] ?? m;
}
