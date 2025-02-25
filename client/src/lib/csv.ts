
import type { Flashcard } from "@shared/schema";

export function generateCsv(flashcards: Flashcard[]): string {
  const header = "Front,Back\n";

  const rows = flashcards
    .filter(card => card.aiContent)
    .map(card => {
      const content = card.aiContent!;
      const escapeCsvField = (field: string | undefined) => {
        if (!field) return '""';
        return `"${field.toString().replace(/"/g, '""')}"`;
      };
      
      // Combine all content into a single back field
      const backContent = [
        content.definition || '',
        content.part_of_speech_synonyms || '',
        content.example_sentence?.replace(/_/g, '') || '',
      ].filter(Boolean).join('\n');
      
      return [
        escapeCsvField(card.word),
        escapeCsvField(backContent)
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
