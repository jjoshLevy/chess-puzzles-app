import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

// --- EXISTING TABLES FROM YOUR PROJECT ---

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  rating: integer("rating").default(1500).notNull(),
});

export const puzzles = pgTable("puzzles", {
  id: serial("id").primaryKey(),
  puzzleId: varchar("puzzleId", { length: 8 }).notNull().unique(),
  fen: text("fen").notNull(),
  moves: text("moves").notNull(),
  rating: integer("rating").notNull(),
  ratingDeviation: integer("ratingDeviation").notNull(),
  popularity: integer("popularity").notNull(),
  nbPlays: integer("nbPlays").notNull(),
  themes: text("themes"),
  gameUrl: text("gameUrl"),
  openingTags: text("openingTags"),
  // Adding fields from your schema if they exist
  category: text("category"),
  difficulty: text("difficulty"),
  objective: text("objective"),
});

export const puzzleSolutions = pgTable("puzzle_solutions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  puzzleId: integer("puzzle_id").references(() => puzzles.id),
  solved: boolean("solved").notNull(),
  solveTime: integer("solve_time"), // in seconds
  attempts: integer("attempts").default(1),
  solvedAt: timestamp("solved_at").defaultNow(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  puzzleId: integer("puzzle_id").references(() => puzzles.id),
  bookmarkedAt: timestamp("bookmarked_at").defaultNow(),
});

// --- NEW USERS TABLE (if it wasn't already there) ---
// This ensures the users table is defined correctly.
// If your schema already has a users table, this is redundant but harmless.
// If not, it creates it.
export const users_fallback = pgTable("users_fallback_just_in_case", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  rating: integer("rating").notNull().default(1500),
});