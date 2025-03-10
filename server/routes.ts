import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { insertFlashcardSchema } from "@shared/schema";
import { validateFlashcardContent, FLASHCARD_SYSTEM_PROMPT, generateFlashcardPrompt } from "../client/src/lib/openai";

// Add debug logging for OpenAI key presence
console.log("OpenAI API Key present:", !!process.env.OPENAI_API_KEY);

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
            content: FLASHCARD_SYSTEM_PROMPT
          },
          {
            role: "user",
            content: generateFlashcardPrompt(flashcard.word, flashcard.context)
          }
        ],
        response_format: { type: "json_object" }
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
      const errorMessage = error.code === "insufficient_quota" 
        ? "OpenAI API quota exceeded. Please try again later or check your API key."
        : "Failed to generate AI content";
      res.status(500).json({ error: errorMessage });
    }
  });

  app.delete("/api/flashcards", async (_req, res) => {
    await storage.deleteFlashcards();
    res.json({ message: "All flashcards deleted" });
  });

  app.delete("/api/flashcards/:id", async (req, res) => {
    const { id } = req.params;
    await storage.deleteFlashcard(parseInt(id));
    res.json({ message: "Flashcard deleted" });
  });

  const httpServer = createServer(app);
  return httpServer;
}