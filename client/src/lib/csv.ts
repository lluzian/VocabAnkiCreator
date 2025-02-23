import type { Flashcard } from "@shared/schema";

export function generateCsv(flashcards: Flashcard[]): string {
  const header = "Word,Definition,Example,Synonyms,Mnemonic\n";
  
  const rows = flashcards
    .filter(card => card.aiContent)
    .map(card => {
      const content = card.aiContent!;
      return [
        card.word,
        content.definition,
        content.example,
        content.synonyms.join("; "),
        content.mnemonic
      ].map(field => `"${field.replace(/"/g, '""')}"`).join(",");
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
