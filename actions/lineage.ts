/**
 * Server actions for fetching chunk data and building citation lineage trees.
 *
 * Input data sources: SQLite database via db/index.ts helper functions
 * Output destinations: React components (called from client-side code)
 * Dependencies: db/index.ts (database queries), lib/types.ts (type definitions)
 * Key exports: getChunk, getDirectCitations, getFullLineage
 * Side effects: Database reads only (no writes)
 */

"use server";

import {
  getChunk as dbGetChunk,
  getDirectCitations as dbGetDirectCitations,
  getFullLineage as dbGetFullLineage,
} from "@/db";
import type { Chunk, LineageNode } from "@/lib/types";

export async function getChunk(chunkId: string): Promise<Chunk | null> {
  return dbGetChunk(chunkId);
}

export async function getDirectCitations(chunkId: string): Promise<Chunk[]> {
  const citations = dbGetDirectCitations(chunkId);
  const chunks: Chunk[] = [];

  for (const citation of citations) {
    const chunk = dbGetChunk(citation.target_chunk_id);
    if (chunk) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

export async function getFullLineage(chunkId: string): Promise<LineageNode[]> {
  const lineageRows = dbGetFullLineage(chunkId);
  const chunkMap = new Map<string, Chunk>();

  // Fetch all chunks in lineage
  for (const row of lineageRows) {
    const chunk = dbGetChunk(row.target_chunk_id);
    if (chunk) {
      chunkMap.set(row.target_chunk_id, chunk);
    }
  }

  // Build tree structure
  const nodesByChunkId = new Map<string, LineageNode>();

  // Create nodes
  for (const row of lineageRows) {
    const chunk = chunkMap.get(row.target_chunk_id);
    if (!chunk) continue;

    nodesByChunkId.set(row.target_chunk_id, {
      chunk_id: row.target_chunk_id,
      depth: row.depth,
      chunk,
      children: [],
    });
  }

  // Build parent-child relationships
  const rootNodes: LineageNode[] = [];

  for (const row of lineageRows) {
    const node = nodesByChunkId.get(row.target_chunk_id);
    if (!node) continue;

    if (row.depth === 1) {
      // Direct citation - this is a root in our tree
      rootNodes.push(node);
    } else {
      // Find parent and add as child
      const parentId = row.parent_id;
      const parent = nodesByChunkId.get(parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  }

  return rootNodes;
}
