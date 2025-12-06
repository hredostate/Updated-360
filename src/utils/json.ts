/**
 * Finds and extracts a JSON object or array from a string that may contain surrounding text.
 * This is useful for parsing JSON from AI responses that might include conversational filler.
 * @param text The raw string from the AI response.
 * @returns The parsed JavaScript object/array, or null if no valid JSON is found.
 */
export const extractAndParseJson = <T>(text: string): T | null => {
  try {
    // Find the first '{' or '[' to start the JSON block
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');

    let startIndex = -1;
    if (firstBrace === -1) {
      startIndex = firstBracket;
    } else if (firstBracket === -1) {
      startIndex = firstBrace;
    } else {
      startIndex = Math.min(firstBrace, firstBracket);
    }

    if (startIndex === -1) {
      console.warn("No JSON block found in AI response text.");
      return null;
    }

    // Find the last '}' or ']' to end the JSON block
    const lastBrace = text.lastIndexOf('}');
    const lastBracket = text.lastIndexOf(']');
    const endIndex = Math.max(lastBrace, lastBracket);

    if (endIndex === -1 || endIndex < startIndex) {
      console.warn("Incomplete JSON block found in AI response text.");
      return null;
    }

    const jsonString = text.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonString) as T;

  } catch (e) {
    console.error("Failed to parse JSON from AI response:", e, "\nOriginal text:", text);
    return null;
  }
};


// --- As requested by user ---
type Jsonish = Record<string, unknown> | unknown[];

/**
 * A simple JSON parser with a try-catch block.
 * @param s The string to parse.
 * @returns The parsed object, or null on error.
 */
export function safeJson<T = Jsonish>(s: string): T | null {
  try { return JSON.parse(s) as T; } catch { return null; }
}
