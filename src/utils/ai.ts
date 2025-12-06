/**
 * Extracts the text content from a Gemini `GenerateContentResponse`.
 * Works for both streaming and non-streaming responses.
 * @param resp The response object from the Google AI SDK.
 * @returns The aggregated text content as a string.
 */
export function textFromGemini(resp: any): string {
  if (!resp) return '';
  // Correctly access the text property
  if (typeof resp.text === 'string') {
    return resp.text;
  }
  // Fallback for structured or chunked responses
  return resp.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
}