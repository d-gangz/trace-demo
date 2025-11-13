/**
 * Server actions for providing demo report content and citation mappings.
 *
 * Input data sources: Hardcoded demo content (Stage 2 synthesis insights)
 * Output destinations: React components for display
 * Dependencies: lib/types.ts (CitationMap type)
 * Key exports: getDemoReport, getDemoCitationMap
 * Side effects: None
 */

"use server";

import type { CitationMap } from "@/lib/types";

export async function getDemoReport(): Promise<string> {
  return `# Market Opportunity Analysis Q4 2024

## Strategic Analysis

The convergence of strong market adoption (78%) and improving customer satisfaction (32% increase) suggests sustainable competitive positioning[1]. However, direct competitor analysis indicates vulnerability to specialized entrants in the 27% "emerging player" segment, particularly if they solve the integration challenge that drives current satisfaction.

## Growth Opportunities

The 18% CAGR industry forecast combined with demonstrated financial performance (24% revenue growth) and strong customer retention creates a favorable growth environment[2]. Geographic expansion showing 89% growth in APAC indicates successful international scaling capabilities.

## Product-Market Fit

Product engagement patterns reveal strong value realization, with 42% DAU growth and 41% upsell rates[3]. Cloud migration trends (67% adoption) align with our platform architecture, while enterprise security requirements match our SOC 2 Type II and ISO 27001 certifications.

## Competitive Positioning

Competitive positioning shows defensible advantages: integration capabilities drive 89% satisfaction scores, pricing power evidenced by 18% ACV increase, and enterprise credibility from security certifications[4]. The 45% market share leader position provides scale advantages in R&D and sales efficiency.

---

## References

[1] ins_strategic_analysis_chunk_1
[2] ins_growth_opportunity_chunk_2
[3] ins_product_market_fit_chunk_3
[4] ins_competitive_moat_chunk_4
`;
}

export async function getDemoCitationMap(): Promise<CitationMap> {
  return {
    "[1]": "ins_strategic_analysis_chunk_1",
    "[2]": "ins_growth_opportunity_chunk_2",
    "[3]": "ins_product_market_fit_chunk_3",
    "[4]": "ins_competitive_moat_chunk_4",
  };
}
