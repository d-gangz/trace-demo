/**
 * TypeScript type definitions for citation lineage tracking system.
 *
 * Input data sources: Database schema (content and citations tables)
 * Output destinations: Used throughout components and server actions
 * Dependencies: None (pure type definitions)
 * Key exports: Chunk, Citation, LineageNode, CitationMap
 * Side effects: None
 */

export interface Chunk {
  chunk_id: string;
  text: string;
  stage: number; // 0=raw, 1=insight, 2=synthesis, 3=executive
  type: "raw" | "insight";
  author?: string;
  created_at?: string;
  source_title?: string;
  status?: string;
}

export interface Citation {
  source_chunk_id: string;
  target_chunk_id: string;
  relationship_type: string;
}

export interface LineageNode {
  chunk_id: string;
  depth: number;
  chunk: Chunk;
  children: LineageNode[];
}

export interface CitationMap {
  [citationNumber: string]: string; // e.g., "[1]" -> "raw_market_survey_chunk_1"
}
