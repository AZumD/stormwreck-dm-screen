/**
 * Phase 1 Drizzle schema (ESM).
 * Campaign-scoped play data + global item catalogue.
 */
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const membershipRoleEnum = pgEnum("membership_role", ["dm", "player"]);
export const characterTypeEnum = pgEnum("character_type", ["player", "sidekick", "npc"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  passwordHash: text("password_hash"),
  authSubject: text("auth_subject"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  /* Unique on lower(btrim(email)) is enforced in SQL migration 0002 */
  emailUq: uniqueIndex("users_email_uq").on(t.email),
  authSubjectUq: uniqueIndex("users_auth_subject_uq").on(t.authSubject)
}));

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: text("token_hash").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => ({
    tokenHashUq: uniqueIndex("sessions_token_hash_uq").on(t.tokenHash)
  })
);

export const gameSystems = pgTable("game_systems", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(), /* slug, e.g. stormwreck-isle */
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  gameSystemId: text("game_system_id")
    .notNull()
    .references(() => gameSystems.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const campaignMemberships = pgTable(
  "campaign_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull().default("player"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => ({
    membershipUq: uniqueIndex("campaign_memberships_campaign_user_uq").on(t.campaignId, t.userId)
  })
);

export const characters = pgTable("characters", {
  id: text("id").primaryKey(), /* preserve catalogue ids when importing */
  name: text("name").notNull(),
  type: characterTypeEnum("type").notNull().default("player"),
  gameSystemId: text("game_system_id")
    .notNull()
    .references(() => gameSystems.id),
  portraitUrl: text("portrait_url"),
  sheet: jsonb("sheet").notNull().default({}),
  cataloguePcId: text("catalogue_pc_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const campaignCharacters = pgTable(
  "campaign_characters",
  {
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.campaignId, t.characterId] })
  })
);

export const characterControllers = pgTable(
  "character_controllers",
  {
    characterId: text("character_id")
      .notNull()
      .references(() => characters.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.characterId, t.userId] })
  })
);

export const characterState = pgTable("character_state", {
  characterId: text("character_id")
    .primaryKey()
    .references(() => characters.id, { onDelete: "cascade" }),
  systemState: jsonb("system_state").notNull().default({}),
  extras: jsonb("extras").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const items = pgTable("items", {
  id: text("id").primaryKey(), /* e.g. sw-herb-black-rose */
  name: text("name").notNull(),
  itemType: text("item_type"),
  rarity: text("rarity"),
  value: text("value"),
  weight: text("weight"),
  attunement: boolean("attunement").notNull().default(false),
  description: text("description").notNull().default(""),
  properties: text("properties").notNull().default(""),
  notes: text("notes").notNull().default(""),
  category: text("category"),
  tags: jsonb("tags").notNull().default([]),
  portraitUrl: text("portrait_url"),
  extras: jsonb("extras").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const inventoryEntries = pgTable("inventory_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  characterId: text("character_id")
    .notNull()
    .references(() => characters.id, { onDelete: "cascade" }),
  itemId: text("item_id").references(() => items.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull().default(1),
  equipped: boolean("equipped").notNull().default(false),
  notes: text("notes").notNull().default(""),
  customName: text("custom_name"),
  /* Ad-hoc item not in catalogue (Phase 1: nullable itemId + snapshot) */
  customItem: jsonb("custom_item"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const playerNotes = pgTable("player_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  characterId: text("character_id").references(() => characters.id, { onDelete: "set null" }),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

/** Phase 5D: catalogue NPCs revealed to players for this campaign */
export const campaignRevealedNpcs = pgTable(
  "campaign_revealed_npcs",
  {
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    npcId: text("npc_id").notNull(),
    revealedBy: uuid("revealed_by").references(() => users.id, { onDelete: "set null" }),
    revealedAt: timestamp("revealed_at", { withTimezone: true }).defaultNow().notNull(),
    note: text("note").notNull().default("")
  },
  (t) => ({
    pk: primaryKey({ columns: [t.campaignId, t.npcId] })
  })
);

export const userAvailability = pgTable(
  "user_availability",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(), /* stored as SQL date; Drizzle text for simplicity */
    status: text("status").notNull().default("available"),
    availableFrom: text("available_from"),
    availableUntil: text("available_until"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.date] })
  })
);

export const campaignEvents = pgTable("campaign_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  location: text("location").notNull().default(""),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("scheduled"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const campaignEventRsvps = pgTable(
  "campaign_event_rsvps",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => campaignEvents.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("going"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
  },
  (t) => ({
    pk: primaryKey({ columns: [t.eventId, t.userId] })
  })
);

export const campaignPosts = pgTable("campaign_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentPostId: uuid("parent_post_id"),
  body: text("body").notNull().default(""),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const platformEvents = pgTable("platform_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  location: text("location").notNull().default(""),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("scheduled"),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const platformPosts = pgTable("platform_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorUserId: uuid("author_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentPostId: uuid("parent_post_id"),
  body: text("body").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
