// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface FlashcardAIContent {
  definition: string;
  part_of_speech_synonyms: string;
  example_sentence: string;
}

export const FLASHCARD_SYSTEM_PROMPT = 
  "You are a helpful language tutor. Generate the back of an English vocabulary flashcard in a specific format. Follow this structure:\n\n" +
  "1. Provide a clear and concise definition of the word. End the definition with '(def.)' without using commas or semicolons.\n\n" +
  "2. On the next line, provide the part of speech (e.g., Noun, Verb, Adjective). Then, list three of the most relevant synonyms in this format: e.g. a) [Synonym 1] b) [Synonym 2] c) [Synonym 3]. Avoid using commas or semicolons by using 'and' where necessary.\n\n" +
  "3. On the next line, write a short and natural example sentence using the word in context. This sentence should be italicized and should not include commas or semicolons.\n\n" +
  "Return the output in JSON format with the following structure:\n" +
  "{\n" +
  "  definition: string,\n" +
  "  part_of_speech_synonyms: string,\n" +
  "  example_sentence: string\n" +
  "}";

export function generateFlashcardPrompt(word: string, context?: string): string {
  let prompt = `Generate flashcard content for the word: "${word}"`;

  if (context) {
    prompt += `\nContext where the word was encountered: "${context}"`;
  }

  return prompt;
}

export function validateFlashcardContent(content: any): content is FlashcardAIContent {
  return (
    typeof content === 'object' &&
    typeof content.definition === 'string' &&
    typeof content.part_of_speech_synonyms === 'string' &&
    typeof content.example_sentence === 'string'
  );
}