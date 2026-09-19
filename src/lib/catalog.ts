/**
 * Catalogue des bookmakers disponibles au Gabon & en Afrique,
 * ligues réelles suivies et ligues virtuelles scannées.
 */

export type BookmakerSeed = {
  slug: string;
  name: string;
  color: string;
  textColor: string;
  margin: number; // marge moyenne pré-match
  virtualMargin: number; // marge sur les virtuels
  volatility: number; // amplitude du bruit de cotation
  hasVirtuals: boolean;
  region: string;
};

export const BOOKMAKERS: BookmakerSeed[] = [
  {
    slug: "1xbet",
    name: "1xBet",
    color: "#0f7ae5",
    textColor: "#ffffff",
    margin: 0.042,
    virtualMargin: 0.082,
    volatility: 1.35,
    hasVirtuals: true,
    region: "Gabon · Afrique",
  },
  {
    slug: "melbet",
    name: "Melbet",
    color: "#11151c",
    textColor: "#ffc531",
    margin: 0.045,
    virtualMargin: 0.085,
    volatility: 1.3,
    hasVirtuals: true,
    region: "Gabon · Afrique",
  },
  {
    slug: "betwinner",
    name: "BetWinner",
    color: "#1aa861",
    textColor: "#ffffff",
    margin: 0.05,
    virtualMargin: 0.09,
    volatility: 1.15,
    hasVirtuals: true,
    region: "Gabon · Afrique",
  },
  {
    slug: "22bet",
    name: "22Bet",
    color: "#3b2f8f",
    textColor: "#ffffff",
    margin: 0.055,
    virtualMargin: 0.095,
    volatility: 1.1,
    hasVirtuals: true,
    region: "Gabon · Afrique",
  },
  {
    slug: "linebet",
    name: "Linebet",
    color: "#19c37d",
    textColor: "#062017",
    margin: 0.052,
    virtualMargin: 0.092,
    volatility: 1.2,
    hasVirtuals: true,
    region: "Gabon · Afrique",
  },
  {
    slug: "megapari",
    name: "MegaPari",
    color: "#c8a24a",
    textColor: "#141005",
    margin: 0.058,
    virtualMargin: 0.1,
    volatility: 1.0,
    hasVirtuals: true,
    region: "Gabon · Afrique",
  },
  {
    slug: "premierbet",
    name: "Premier Bet",
    color: "#0b3d91",
    textColor: "#ffd400",
    margin: 0.072,
    virtualMargin: 0.115,
    volatility: 0.85,
    hasVirtuals: true,
    region: "Gabon · RDC · Cameroun",
  },
  {
    slug: "betway",
    name: "Betway",
    color: "#161616",
    textColor: "#4dff9d",
    margin: 0.062,
    virtualMargin: 0.105,
    volatility: 0.8,
    hasVirtuals: false,
    region: "Afrique de l'Ouest & Centrale",
  },
];

export type LeagueSeed = {
  name: string;
  sport: "football" | "tennis" | "basketball";
  teams: string[];
};

export const REAL_LEAGUES: LeagueSeed[] = [
  {
    name: "Ligue 1 · France",
    sport: "football",
    teams: [
      "Paris SG", "Marseille", "Monaco", "Lyon", "Lille", "Nice",
      "Lens", "Rennes", "Strasbourg", "Toulouse", "Nantes", "Brest",
    ],
  },
  {
    name: "Premier League · Angleterre",
    sport: "football",
    teams: [
      "Arsenal", "Man City", "Liverpool", "Chelsea", "Tottenham",
      "Man United", "Newcastle", "Aston Villa", "Brighton", "West Ham",
    ],
  },
  {
    name: "LaLiga · Espagne",
    sport: "football",
    teams: [
      "Real Madrid", "FC Barcelone", "Atlético Madrid", "Séville",
      "Real Sociedad", "Villarreal", "Betis", "Valence", "Athletic Club", "Girona",
    ],
  },
  {
    name: "Serie A · Italie",
    sport: "football",
    teams: [
      "Inter", "AC Milan", "Juventus", "Napoli", "Roma", "Lazio",
      "Atalanta", "Fiorentina", "Bologne", "Torino",
    ],
  },
  {
    name: "CAF Ligue des Champions",
    sport: "football",
    teams: [
      "Al Ahly", "Zamalek", "Wydad AC", "Espérance Tunis", "Mamelodi Sundowns",
      "TP Mazembe", "Raja Casablanca", "ASEC Mimosas", "Simba SC", "Petro de Luanda",
    ],
  },
  {
    name: "National Foot 1 · Gabon",
    sport: "football",
    teams: [
      "AS Stade Mandji", "Mangasport", "CF Mounana", "AS Pélican",
      "Bouenguidi Sports", "US Bitam", "Akanda FC", "Nguen'Asuku FC",
      "Olympique de Mandji", "Lozo Sport",
    ],
  },
  {
    name: "ATP · Circuit Mondial",
    sport: "tennis",
    teams: [
      "C. Alcaraz", "J. Sinner", "N. Djokovic", "A. Zverev", "D. Medvedev",
      "T. Fritz", "C. Ruud", "A. Rublev", "H. Rune", "F. Auger-Aliassime",
    ],
  },
  {
    name: "NBA · Saison régulière",
    sport: "basketball",
    teams: [
      "Boston Celtics", "Denver Nuggets", "LA Lakers", "Golden State",
      "Milwaukee Bucks", "Phoenix Suns", "Dallas Mavericks", "Miami Heat",
      "OKC Thunder", "Minnesota Wolves",
    ],
  },
];

export const VIRTUAL_LEAGUES: LeagueSeed[] = [
  {
    name: "Virtual Football League",
    sport: "football",
    teams: [
      "V-Lions", "V-Sharks", "V-Eagles", "V-Wolves", "V-Tigers",
      "V-Dragons", "V-Falcons", "V-Panthers", "V-Bulls", "V-Cobras",
    ],
  },
  {
    name: "Virtual Ligue Gabon",
    sport: "football",
    teams: [
      "Libreville City", "Port-Gentil Utd", "Franceville FC", "Oyem Stars",
      "Lambaréné Rovers", "Moanda Athletic", "Tchibanga FC", "Koulamoutou SC",
    ],
  },
  {
    name: "Virtual Tennis Open",
    sport: "tennis",
    teams: [
      "V-A. Kramer", "V-D. Santos", "V-M. Ivanov", "V-T. Bernard",
      "V-K. Oshiro", "V-R. Delgado", "V-S. Mballa", "V-L. Fontaine",
    ],
  },
  {
    name: "Virtual Basketball Pro",
    sport: "basketball",
    teams: [
      "V-Rockets", "V-Jets", "V-Comets", "V-Storm",
      "V-Titans", "V-Blaze", "V-Giants", "V-Sonic",
    ],
  },
];

/** Marchés scannés par sport */
export const MARKETS_BY_SPORT: Record<string, string[]> = {
  football: ["1X2", "OU25", "BTTS"],
  tennis: ["12"],
  basketball: ["12", "OU2"],
};

export const SPORT_LABELS: Record<string, string> = {
  football: "Football",
  tennis: "Tennis",
  basketball: "Basketball",
};
