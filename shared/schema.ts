import { pgTable, text, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  context: text("context"),
  aiContent: jsonb("ai_content").$type<{
    definition: string;
    example: string;
    synonyms: string[];
    mnemonic: string;
  }>(),
});

export const insertFlashcardSchema = createInsertSchema(flashcards).pick({
  word: true,
  context: true,
});

export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
