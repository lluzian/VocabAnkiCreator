import { flashcards, type Flashcard, type InsertFlashcard } from "@shared/schema";

export interface IStorage {
  getFlashcards(): Promise<Flashcard[]>;
  createFlashcard(flashcard: InsertFlashcard): Promise<Flashcard>;
  updateFlashcardAIContent(id: number, aiContent: Flashcard["aiContent"]): Promise<Flashcard>;
  deleteFlashcards(): Promise<void>;
  deleteFlashcard(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private flashcards: Map<number, Flashcard>;
  private currentId: number;

  constructor() {
    this.flashcards = new Map();
    this.currentId = 1;
  }

  async getFlashcards(): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values());
  }

  async createFlashcard(insertFlashcard: InsertFlashcard): Promise<Flashcard> {
    const id = this.currentId++;
    const flashcard: Flashcard = { 
      ...insertFlashcard, 
      id,
      aiContent: null 
    };
    this.flashcards.set(id, flashcard);
    return flashcard;
  }

  async updateFlashcardAIContent(id: number, aiContent: Flashcard["aiContent"]): Promise<Flashcard> {
    const flashcard = this.flashcards.get(id);
    if (!flashcard) {
      throw new Error("Flashcard not found");
    }
    const updated = { ...flashcard, aiContent };
    this.flashcards.set(id, updated);
    return updated;
  }

  async deleteFlashcards(): Promise<void> {
    this.flashcards.clear();
  }

  async deleteFlashcard(id: number): Promise<void> {
    if (this.flashcards.has(id)) {
      this.flashcards.delete(id);
    } else {
      throw new Error("Flashcard not found");
    }
  }
}

export const storage = new MemStorage();