/**
 * Test script for markdown-utils.ts functions
 */

import { parseCitationMap, extractCitationMarkers } from "./lib/markdown-utils";

// Test data
const sampleMarkdown = `# Market Opportunity Analysis Q4 2024

## Strategic Analysis

The convergence of strong market adoption (78%) and improving customer satisfaction (32% increase) suggests sustainable competitive positioning[1]. However, direct competitor analysis indicates vulnerability to specialized entrants in the 27% "emerging player" segment[2].

## Growth Opportunities

The 18% CAGR industry forecast combined with demonstrated financial performance (24% revenue growth) and strong customer retention creates a favorable growth environment[3].

---

## References

[1] ins_strategic_analysis_chunk_1
[2] ins_growth_opportunity_chunk_2
[3] ins_product_market_fit_chunk_3
`;

const textWithCitations = 'The convergence of strong market adoption (78%)[1] and improving customer satisfaction (32% increase)[2] suggests sustainable competitive positioning.';

console.log("Testing parseCitationMap...");
const citationMap = parseCitationMap(sampleMarkdown);
console.log("Citation map:", citationMap);
console.log("Expected: { '[1]': 'ins_strategic_analysis_chunk_1', '[2]': 'ins_growth_opportunity_chunk_2', '[3]': 'ins_product_market_fit_chunk_3' }");
console.log("✅ Test passed:",
  citationMap["[1]"] === "ins_strategic_analysis_chunk_1" &&
  citationMap["[2]"] === "ins_growth_opportunity_chunk_2" &&
  citationMap["[3]"] === "ins_product_market_fit_chunk_3"
);

console.log("\n" + "=".repeat(60) + "\n");

console.log("Testing extractCitationMarkers...");
const markers = extractCitationMarkers(textWithCitations);
console.log("Markers:", markers);
console.log("Expected: ['[1]', '[2]']");
console.log("✅ Test passed:",
  markers.length === 2 &&
  markers[0] === "[1]" &&
  markers[1] === "[2]"
);

console.log("\n" + "=".repeat(60) + "\n");

console.log("Testing extractCitationMarkers with no duplicates...");
const textWithDuplicates = "Text [1] with [2] multiple [1] citations [2] including duplicates [1].";
const uniqueMarkers = extractCitationMarkers(textWithDuplicates);
console.log("Markers:", uniqueMarkers);
console.log("Expected: ['[1]', '[2]'] (no duplicates)");
console.log("✅ Test passed:",
  uniqueMarkers.length === 2 &&
  uniqueMarkers.includes("[1]") &&
  uniqueMarkers.includes("[2]")
);
