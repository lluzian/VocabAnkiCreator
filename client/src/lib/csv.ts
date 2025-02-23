import type { Flashcard } from "@shared/schema";

export function generateCsv(flashcards: Flashcard[]): string {
  const header = "Front,Back\n";

  const rows = flashcards
    .filter(card => card.aiContent)
    .map(card => {
      const content = card.aiContent!;
      const back = [
        `Definition: ${content.definition}`,
        `Example: ${content.example}`,
        `Synonyms: ${content.synonyms.join(", ")}`,
        `Mnemonic: ${content.mnemonic}`
      ].join("<br>");

      return `${card.word};${back.replace(/"/g, '""')}`;
    })
    .join("\n");

  return header + rows;
}

export function downloadCsv(flashcards: Flashcard[]) {
  const csv = generateCsv(flashcards);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "anki_flashcards.csv";
  link.click();
}