import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { insertFlashcardSchema } from "@shared/schema";

// Add debug logging for OpenAI key presence
console.log("OpenAI API Key present:", !!process.env.OPENAI_API_KEY);

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
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
    const flashcard = (await storage.getFlashcards()).find(f => f.id === parseInt(id));

    if (!flashcard) {
      return res.status(404).json({ error: "Flashcard not found" });
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful language tutor. Generate content for a flashcard with definition, example sentence, synonyms, and a memorable mnemonic. Return in JSON format."
          },
          {
            role: "user",
            content: `Word: ${flashcard.word}\nContext (if any): ${flashcard.context || 'None provided'}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const aiContent = JSON.parse(response.choices[0].message.content);
      const updated = await storage.updateFlashcardAIContent(flashcard.id, aiContent);
      res.json(updated);
    } catch (error) {
      console.error("OpenAI API Error:", error);
      res.status(500).json({ error: "Failed to generate AI content" });
    }
  });

  app.delete("/api/flashcards", async (_req, res) => {
    await storage.deleteFlashcards();
    res.json({ message: "All flashcards deleted" });
  });

  const httpServer = createServer(app);
  return httpServer;
}