
import type { Flashcard } from "@shared/schema";

export function generateCsv(flashcards: Flashcard[]): string {
  const header = "Word,Definition,Example,Synonyms\n";

  const rows = flashcards
    .filter(card => card.aiContent)
    .map(card => {
      const content = card.aiContent!;
      // Properly escape fields and handle quotes
      const escapeCsvField = (field: string) => `"${field.replace(/"/g, '""')}"`;
      
      return [
        escapeCsvField(card.word),
        escapeCsvField(content.definition),
        escapeCsvField(content.example),
        escapeCsvField(content.synonyms.join(", "))
      ].join(",");
    })
    .join("\n");

  return header + rows;
}

export function downloadCsv(flashcards: Flashcard[]) {
  const csv = generateCsv(flashcards);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "flashcards.csv";
  link.click();
}
