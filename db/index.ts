/**
 * Database connection utilities and query helpers for citation lineage tracking.
 *
 * Input data sources: SQLite database at data/trace-demo.db
 * Output destinations: Returns chunks, citations, and lineage data structures
 * Dependencies: better-sqlite3, fs, path
 * Key exports: getDb, initDb, getChunk, getDirectCitations, getFullLineage
 * Side effects: Creates database connection singleton, creates tables via schema.sql
 */

import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join } from "path";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = join(process.cwd(), "data", "trace-demo.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
  }
  return db;
}

export function initDb(): void {
  const db = getDb();
  const schemaPath = join(process.cwd(), "db", "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  db.exec(schema);
}

export interface Chunk {
  chunk_id: string;
  text: string;
  stage: number;
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

export function getChunk(chunkId: string): Chunk | null {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM content WHERE chunk_id = ?");
  return stmt.get(chunkId) as Chunk | null;
}

export function getDirectCitations(chunkId: string): Citation[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT source_chunk_id, target_chunk_id, relationship_type
    FROM citations
    WHERE source_chunk_id = ?
  `);
  return stmt.all(chunkId) as Citation[];
}

export interface LineageRow {
  target_chunk_id: string;
  depth: number;
  parent_id: string;
}

export function getFullLineage(chunkId: string): LineageRow[] {
  const db = getDb();
  const stmt = db.prepare(`
    WITH RECURSIVE lineage AS (
      -- Base case: direct citations
      SELECT
        target_chunk_id,
        1 as depth,
        source_chunk_id as parent_id
      FROM citations
      WHERE source_chunk_id = ?

      UNION ALL

      -- Recursive case: follow citations of citations
      SELECT
        c.target_chunk_id,
        l.depth + 1,
        c.source_chunk_id as parent_id
      FROM citations c
      INNER JOIN lineage l ON c.source_chunk_id = l.target_chunk_id
      WHERE l.depth < 10
    )
    SELECT * FROM lineage ORDER BY depth, target_chunk_id
  `);
  return stmt.all(chunkId) as LineageRow[];
}
