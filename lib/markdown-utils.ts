/**
 * Utilities for parsing citations from markdown content
 *
 * Input data sources: Markdown strings with citation references
 * Output destinations: Citation maps and marker arrays
 * Dependencies: None (pure functions)
 * Key exports: parseCitationMap, extractCitationMarkers
 * Side effects: None
 */

/**
 * Parse citation references from markdown content
 * Expects format: [1] chunk_id - description
 * Returns map: { "[1]": "chunk_id" }
 */
export function parseCitationMap(markdown: string): Record<string, string> {
  const map: Record<string, string> = {};

  // Find References section
  const referencesMatch = markdown.match(/##\s+References\s+([\s\S]*?)($|##)/);
  if (!referencesMatch) return map;

  const referencesSection = referencesMatch[1];

  // Match pattern: [1] chunk_id (with optional description after)
  // Example: [1] raw_market_survey_chunk_1
  //      or: [1] raw_market_survey_chunk_1 - Market Survey Q3 2024
  const citationRegex = /\[(\d+)\]\s+([a-zA-Z0-9_]+)/g;

  let match;
  while ((match = citationRegex.exec(referencesSection)) !== null) {
    const [, number, chunkId] = match;
    map[`[${number}]`] = chunkId;
  }

  return map;
}

/**
 * Extract all citation markers from text (e.g., [1], [2], [3])
 */
export function extractCitationMarkers(text: string): string[] {
  const markers: string[] = [];
  const regex = /\[(\d+)\]/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const marker = match[0]; // e.g., "[1]"
    if (!markers.includes(marker)) {
      markers.push(marker);
    }
  }

  return markers;
}
