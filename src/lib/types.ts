import type { ArbLeg } from "@/db/schema";

export type SurebetEvent = {
  id: number;
  sport: string;
  league: string;
  home: string;
  away: string;
  startsAt: string;
  status: string;
};

export type SurebetDTO = {
  id: number;
  market: string;
  kind: string;
  profitPct: number;
  invSum: number;
  legs: ArbLeg[];
  status: string;
  detectedAt: string;
  lastSeenAt: string;
  expiresAt: string;
  event: SurebetEvent;
};

export type ScanPoint = {
  id: number;
  at: string;
  found: number;
  active: number;
  events: number;
  durationMs: number;
};

export type BookmakerDTO = {
  id: number;
  slug: string;
  name: string;
  color: string;
  textColor: string;
  region: string;
  hasVirtuals: boolean;
};

export type StatsDTO = {
  activeSurebets: number;
  activeReal: number;
  activeVirtual: number;
  avgProfit: number;
  bestProfit: number;
  upcomingEvents: number;
  totalDetected: number;
  scanHistory: ScanPoint[];
  byBookmaker: { name: string; slug: string; hits: number }[];
  bookmakers: BookmakerDTO[];
};

export const fmtFCFA = (n: number) =>
  `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n))} FCFA`;

export const fmtNum = (n: number, digits = 2) =>
  new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
