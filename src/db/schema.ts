import {
  pgTable,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const bookmakers = pgTable("bookmakers", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  textColor: text("text_color").notNull().default("#ffffff"),
  margin: real("margin").notNull().default(0.05),
  virtualMargin: real("virtual_margin").notNull().default(0.09),
  volatility: real("volatility").notNull().default(1),
  hasVirtuals: boolean("has_virtuals").notNull().default(true),
  region: text("region").notNull().default("Afrique Centrale"),
  active: boolean("active").notNull().default(true),
});

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    sport: text("sport").notNull(), // football | tennis | basketball
    league: text("league").notNull(),
    home: text("home").notNull(),
    away: text("away").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    kind: text("kind").notNull().default("real"), // real | virtual
    status: text("status").notNull().default("upcoming"), // upcoming | live | finished
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("events_kind_idx").on(t.kind),
    index("events_starts_idx").on(t.startsAt),
  ],
);

export const odds = pgTable(
  "odds",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    bookmakerId: integer("bookmaker_id")
      .notNull()
      .references(() => bookmakers.id, { onDelete: "cascade" }),
    market: text("market").notNull(), // 1X2 | OU25 | BTTS | 12
    outcome: text("outcome").notNull(), // 1 | X | 2 | over | under | yes | no
    price: real("price").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("odds_unique").on(t.eventId, t.bookmakerId, t.market, t.outcome),
    index("odds_event_idx").on(t.eventId),
  ],
);

export type ArbLeg = {
  outcome: string;
  outcomeLabel: string;
  bookmakerSlug: string;
  bookmakerName: string;
  bookmakerColor: string;
  bookmakerTextColor: string;
  price: number;
  stakeFraction: number;
};

export const surebets = pgTable(
  "surebets",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    market: text("market").notNull(),
    kind: text("kind").notNull().default("real"),
    profitPct: real("profit_pct").notNull(),
    invSum: real("inv_sum").notNull(),
    legs: jsonb("legs").$type<ArbLeg[]>().notNull(),
    status: text("status").notNull().default("active"), // active | expired
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("surebets_event_market").on(t.eventId, t.market),
    index("surebets_status_idx").on(t.status),
    index("surebets_profit_idx").on(t.profitPct),
  ],
);

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull().default("auto"),
  eventsScanned: integer("events_scanned").notNull().default(0),
  oddsUpdated: integer("odds_updated").notNull().default(0),
  surebetsFound: integer("surebets_found").notNull().default(0),
  activeSurebets: integer("active_surebets").notNull().default(0),
  durationMs: integer("duration_ms").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Bookmaker = typeof bookmakers.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type Surebet = typeof surebets.$inferSelect;
