import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Puzzles table for chess puzzles
export const puzzles = pgTable("puzzles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  fen: text("fen").notNull(), // Chess position in FEN notation
  solution: jsonb("solution").notNull(), // Array of moves in algebraic notation
  moves: jsonb("moves"), // Additional move sequences
  objective: text("objective"), // What the puzzle is trying to teach
  difficulty: varchar("difficulty", { length: 50 }).default("intermediate"),
  category: varchar("category", { length: 100 }).default("tactics"),
  theme: varchar("theme", { length: 100 }), // Pin, fork, skewer, etc.
  rating: integer("rating").default(1500), // Elo-style rating
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schema for validation
export const insertPuzzleSchema = createInsertSchema(puzzles).omit({
  id: true,
  createdAt: true,
});

// TypeScript type for use in the frontend and backend code
export type Puzzle = typeof puzzles.$inferSelect;