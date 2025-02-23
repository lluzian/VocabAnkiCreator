// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

export interface FlashcardAIContent {
  definition: string;
  example: string;
  synonyms: string[];
  mnemonic: string;
}

export const FLASHCARD_SYSTEM_PROMPT = 
  "You are a helpful language tutor. Generate comprehensive flashcard content for English vocabulary learning. " +
  "Include a clear definition, a natural example sentence that demonstrates usage, relevant synonyms, and a memorable mnemonic device. " +
  "Format your response as a JSON object with the following structure:\n" +
  "{\n" +
  "  \"definition\": \"clear and concise definition\",\n" +
  "  \"example\": \"natural example sentence\",\n" +
  "  \"synonyms\": [\"synonym1\", \"synonym2\", \"synonym3\"],\n" +
  "  \"mnemonic\": \"memorable learning tip or mnemonic device\"\n" +
  "}";

export function generateFlashcardPrompt(word: string, context?: string): string {
  let prompt = `Generate flashcard content for the word: "${word}"`;
  
  if (context) {
    prompt += `\nContext where the word was encountered: "${context}"`;
  }
  
  prompt += "\n\nProvide a response that includes:\n" +
    "1. A clear and concise definition that's easy to understand\n" +
    "2. A natural example sentence that shows how the word is used in context\n" +
    "3. 2-3 relevant synonyms that help understand the word's meaning\n" +
    "4. A memorable mnemonic device or learning tip to help remember the word";

  return prompt;
}

export function validateFlashcardContent(content: any): content is FlashcardAIContent {
  return (
    typeof content === 'object' &&
    typeof content.definition === 'string' &&
    typeof content.example === 'string' &&
    Array.isArray(content.synonyms) &&
    content.synonyms.every(s => typeof s === 'string') &&
    typeof content.mnemonic === 'string'
  );
}
