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

export const campaigns = pgTable("campaigns", {
  id: text("id").primaryKey(), /* slug, e.g. stormwreck-isle */
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
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
  campaignId: text("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: characterTypeEnum("type").notNull().default("player"),
  level: integer("level").notNull().default(1),
  portraitUrl: text("portrait_url"),
  /* Mostly-static sheet fields; extend carefully — variable bits go in character_state.sheet */
  sheet: jsonb("sheet").notNull().default({}),
  cataloguePcId: text("catalogue_pc_id"), /* optional link to legacy global PC catalogue id */
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

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
  hpCurrent: integer("hp_current"),
  hpMax: integer("hp_max"),
  hpTemp: integer("hp_temp").notNull().default(0),
  conditions: jsonb("conditions").notNull().default([]),
  deathSaves: jsonb("death_saves").notNull().default({}),
  spellSlots: jsonb("spell_slots").notNull().default({}),
  classResources: jsonb("class_resources").notNull().default({}),
  inspiration: boolean("inspiration").notNull().default(false),
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
