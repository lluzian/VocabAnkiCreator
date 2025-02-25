import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { insertFlashcardSchema } from "@shared/schema";
import { validateFlashcardContent } from "../client/src/lib/openai";

// Add debug logging for OpenAI key presence
console.log("OpenAI API Key present:", !!process.env.OPENAI_API_KEY);

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express) {
  app.get("/api/flashcards", async (_req, res) => {
    const flashcards = await storage.getFlashcards();
    res.json(flashcards);
  });

  app.post("/api/flashcards", async (req, res) => {
    const result = insertFlashcardSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid flashcard data" });
    }

    const flashcard = await storage.createFlashcard(result.data);
    res.json(flashcard);
  });

  app.post("/api/flashcards/:id/generate", async (req, res) => {
    const { id } = req.params;
    const flashcard = (await storage.getFlashcards()).find(
      (f) => f.id === parseInt(id),
    );

    if (!flashcard) {
      return res.status(404).json({ error: "Flashcard not found" });
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful language tutor. Generate the back of an English vocabulary flashcard in a specific format. Follow this structure:\n\n1. Provide a clear and concise definition of the word. End the definition with '(def.)' without using commas or semicolons.\n\n2. On the next line, provide the phonetic pronunciation (using the International Phonetic Alphabet) followed by the part of speech (e.g., Noun, Verb, Adjective). Then, list three of the most relevant synonyms in this format: e.g. a) [Synonym 1] b) [Synonym 2] c) [Synonym 3]. Avoid using commas or semicolons by using 'and' where necessary. This entire information should be returned as a single string.\n\n3. On the next line, write a short and natural example sentence using the word in context. This sentence should be italicized and should not include commas or semicolons.\n\nReturn the output in JSON format with the following structure:\n{\n  definition: string,\n  pronunciation_part_of_speech_synonyms: string,\n  example_sentence: string\n}",
          },
          {
            role: "user",
            content: `Generate flashcard content for the word: "${flashcard.word}"${flashcard.context ? `\nContext: ${flashcard.context}` : ""}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      if (!response.choices[0].message.content) {
        throw new Error("No content in OpenAI response");
      }

      const aiContent = JSON.parse(response.choices[0].message.content);

      // Validate the AI response structure
      if (!validateFlashcardContent(aiContent)) {
        throw new Error("Invalid AI response format");
      }

      const updated = await storage.updateFlashcardAIContent(
        flashcard.id,
        aiContent,
      );
      res.json(updated);
    } catch (error: any) {
      console.error("OpenAI API Error:", error);
      const errorMessage =
        error.code === "insufficient_quota"
          ? "OpenAI API quota exceeded. Please try again later or check your API key."
          : "Failed to generate AI content";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.delete("/api/flashcards", async (_req, res) => {
    await storage.deleteFlashcards();
    res.json({ message: "All flashcards deleted" });
  });

  const httpServer = createServer(app);
  return httpServer;
}