-- Content table: stores all chunks (raw data + insights)
CREATE TABLE IF NOT EXISTS content (
  chunk_id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  stage INTEGER NOT NULL,  -- 0=raw, 1=first-order insight, 2=synthesis, 3=executive
  type TEXT NOT NULL,       -- 'raw' or 'insight'
  author TEXT,
  created_at TEXT,          -- ISO 8601 format
  source_title TEXT,        -- For raw data: "Market Survey Q3 2024"
  status TEXT DEFAULT 'published'
);

-- Citations table: edges between chunks
CREATE TABLE IF NOT EXISTS citations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_chunk_id TEXT NOT NULL,
  target_chunk_id TEXT NOT NULL,
  citation_marker TEXT,          -- e.g., "[1]", "[2]" - maps to citation number in chunk text
  relationship_type TEXT DEFAULT 'cites',
  FOREIGN KEY (source_chunk_id) REFERENCES content(chunk_id),
  FOREIGN KEY (target_chunk_id) REFERENCES content(chunk_id)
);

-- Indexes for fast lineage traversal
CREATE INDEX IF NOT EXISTS idx_citations_source ON citations(source_chunk_id);
CREATE INDEX IF NOT EXISTS idx_citations_target ON citations(target_chunk_id);
