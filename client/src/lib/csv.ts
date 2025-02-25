import type { Flashcard } from "@shared/schema";

export function generateCsv(flashcards: Flashcard[]): string {
  const header = "Front,Back\n";

  const rows = flashcards
    .filter(card => card.aiContent)
    .map(card => {
      const content = card.aiContent!;
      const back = [
        content.definition,
        content.pronunciation_part_of_speech_synonyms,
        `<i>${content.example_sentence}</i>`
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