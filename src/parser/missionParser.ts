import { ParseResult } from '../types.ts';
import { parseFallback } from './fallbackParser.ts';

/**
 * Dual Mission Parser:
 * Attempts LLM intent parsing if Gemini API key is available,
 * otherwise immediately uses the deterministic offline fallback parser.
 */
export async function parseMission(prompt: string): Promise<ParseResult> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return parseFallback(trimmed);
  }

  // Check if Gemini API key is present in environment
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
    // No API key configured: instantaneous zero-latency offline fallback
    return parseFallback(trimmed);
  }

  // Attempt Gemini API call with safety timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const systemPrompt = `You are an autonomous warehouse mission parser.
Convert the user instruction into a JSON object adhering to this schema:
{
  "action": "deliver" | "move",
  "targetItem": "red_box" | "blue_box" | "green_box",
  "destination": "zone_a" | "zone_b" | "charging_station",
  "returnToDock": boolean
}
If the instruction is unrelated to moving warehouse crates or cannot be understood, return:
{ "error": "unrecognized" }
Only return raw JSON without markdown formatting.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser command: "${trimmed}"` }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      // API call failed, fallback to offline regex parser
      return parseFallback(trimmed);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return parseFallback(trimmed);
    }

    const parsedJson = JSON.parse(candidateText);
    if (parsedJson.error || !parsedJson.targetItem || !parsedJson.destination) {
      // LLM indicated unrecognized command or incomplete fields, check fallback
      return parseFallback(trimmed);
    }

    return {
      success: true,
      task: {
        action: parsedJson.action === 'move' ? 'move' : 'deliver',
        targetItem: parsedJson.targetItem,
        destination: parsedJson.destination,
        returnToDock: Boolean(parsedJson.returnToDock)
      },
      rawPrompt: trimmed,
      source: 'llm'
    };
  } catch (_err) {
    clearTimeout(timeoutId);
    // On any network error, abort timeout, or parse exception: instant fallback
    return parseFallback(trimmed);
  }
}
