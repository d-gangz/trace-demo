# Citation Lineage Demo - Conversation Summary

## 1. Primary Request and Intent

The user requested help creating a **citation lineage demo prototype** for a consulting firm that wants to build an AI-powered research tool. The main concerns are:

- **Problem**: Citation verification nightmare - need to trace how insights compound across multiple analysis stages
- **Solution**: Build a demo showing lineage end-to-end for an insights report
- **Key Feature**: Users can view citation lineage for each citation in the report
- **Scope**: Display-only demo (no authoring workflow), focusing on lineage visualization

**Specific Requirements Gathered:**
1. Read all documents in `/references` folder for context
2. Sample SQLite database with:
   - Content table (stores chunks - raw data and insights)
   - Citations table (stores citation relationships)
3. Frontend to showcase insights report as Markdown with inline citations
4. Hover over citation → show immediate source (popover)
5. Click "View Full" button → side sheet shows complete lineage tree
6. Use shadcn/ui for components
7. Use bun as package manager
8. Use server actions (not API routes)
9. Database files in `db/` folder, server actions in `actions/` folder

**Critical Data Model Requirements:**
- All data stored as **chunks** with chunk_ids (both raw and insights)
- Stages: 0 (raw), 1 (first-order insights), 2 (synthesis)
- Stage 2 must cite **BOTH** Stage 1 insights AND Stage 0 raw data (mixed citations pattern)
- Double the content: 10 Stage 0 chunks, 8 Stage 1 chunks, 4 Stage 2 chunks (total: 22 chunks)
- Citation markers `[1]`, `[2]` stored in citations table to map to chunk_ids

## 2. Key Technical Concepts

- **Citation Lineage**: Multi-hop tracing from synthesis insights back to raw data sources
- **Chunk-based Storage**: All data (raw and insights) stored as individual chunks with unique IDs
- **Recursive CTEs**: SQL recursive queries to traverse citation graphs
- **Citation Direction**: `source_chunk_id → target_chunk_id` (source cites target)
- **Citation Markers**: Map citation numbers `[1]`, `[2]` to chunk_ids in database
- **Mixed Citation Pattern**: Stage 2 insights cite both Stage 1 insights and Stage 0 raw data directly
- **Immutability Principle**: Once published, insights don't change (from reference docs)
- **Dual Database Architecture** (simplified): SQLite only (no vector DB for MVP)
- **React Server Actions**: Next.js server actions instead of API routes
- **Progressive Disclosure**: Popover on hover, full tree on "View Full" click
- **Vertical Tree Layout**: Top-to-bottom citation lineage display

**Technologies:**
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- SQLite (better-sqlite3)
- shadcn/ui components
- React Markdown
- Tailwind CSS 4
- bun (package manager)

## 3. Files and Code Sections

### `.claude/plan/citation-lineage-demo.md` (Created)
**Purpose**: Comprehensive phase-by-phase implementation plan for a junior engineer

**Key Sections:**

#### Database Schema (Phase 1a):
```sql
-- Content table: stores all chunks (raw data + insights)
CREATE TABLE IF NOT EXISTS content (
  chunk_id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  stage INTEGER NOT NULL,  -- 0=raw, 1=first-order, 2=synthesis
  type TEXT NOT NULL,       -- 'raw' or 'insight'
  author TEXT,
  created_at TEXT,
  source_title TEXT,
  status TEXT DEFAULT 'published'
);

-- Citations table: edges between chunks with citation markers
CREATE TABLE IF NOT EXISTS citations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_chunk_id TEXT NOT NULL,
  target_chunk_id TEXT NOT NULL,
  citation_marker TEXT,          -- e.g., "[1]", "[2]"
  relationship_type TEXT DEFAULT 'cites',
  FOREIGN KEY (source_chunk_id) REFERENCES content(chunk_id),
  FOREIGN KEY (target_chunk_id) REFERENCES content(chunk_id)
);
```

**Why Important**: The `citation_marker` column was added after user identified that we need to map citation numbers to chunk_ids. This is critical for the system to work.

#### Seed Data Structure (Phase 1b):
- **10 Stage 0 chunks**: raw_market_survey_chunk_1 through raw_market_expansion_chunk_10
- **8 Stage 1 chunks**: ins_market_trends_chunk_1 through ins_geographic_expansion_chunk_8
- **4 Stage 2 chunks**: ins_strategic_analysis_chunk_1 through ins_competitive_moat_chunk_4

**Citation Pattern Example (Stage 2 Mixed Citations)**:
```javascript
// ins_strategic_analysis_chunk_1 cites: 2 Stage 1 + 1 Stage 0
{ source: 'ins_strategic_analysis_chunk_1', target: 'ins_market_trends_chunk_1', marker: '[1]' },
{ source: 'ins_strategic_analysis_chunk_1', target: 'ins_customer_sentiment_chunk_3', marker: '[2]' },
{ source: 'ins_strategic_analysis_chunk_1', target: 'raw_competitor_report_chunk_2', marker: '[3]' },
```

**Why Important**: Demonstrates mixed citation pattern - Stage 2 citing both Stage 1 AND Stage 0, which creates multi-hop lineage chains.

#### Database Connection Utilities (Phase 1a):
```typescript
// db/index.ts
export function getFullLineage(chunkId: string): LineageRow[] {
  const db = getDb();
  const stmt = db.prepare(`
    WITH RECURSIVE lineage AS (
      SELECT target_chunk_id, 1 as depth, source_chunk_id as parent_id
      FROM citations
      WHERE source_chunk_id = ?
      UNION ALL
      SELECT c.target_chunk_id, l.depth + 1, c.source_chunk_id as parent_id
      FROM citations c
      INNER JOIN lineage l ON c.source_chunk_id = l.target_chunk_id
      WHERE l.depth < 10
    )
    SELECT * FROM lineage ORDER BY depth, target_chunk_id
  `);
  return stmt.all(chunkId) as LineageRow[];
}
```

**Why Important**: Recursive CTE is the core algorithm for computing full citation lineage trees.

### `references/traceability-v2.md` (Read)
**Content**: Original design document explaining chunk-level recursive citations, immutability principle, and UI prototypes.

**Key Insights Used**:
- All insights stored as chunks with chunk_ids
- Citations point to other chunks (recursive model)
- Progressive disclosure UX pattern

### `references/database-workflow-examples.md` (Read)
**Content**: Concrete examples of how vector DB + PostgreSQL work together for citation lineage.

**Key Insights Used**:
- Citation table structure (source → target)
- Recursive CTE examples for tree traversal
- Tree building logic in Python (adapted to TypeScript)

### `references/insights-process.md` (Read)
**Content**: Pipeline from insight report to database storage.

**Key Insights Used**:
- Citation format: `[1] chunk_id - description`
- Citation parsing with regex
- How chunks and citations are created from reports

### Project Files (Examined):
- `package.json`: Dependencies (Next.js 16, React 19, shadcn/ui packages)
- `app/layout.tsx`: Root layout with Geist fonts
- `app/page.tsx`: Default starter page (to be replaced)
- `components.json`: shadcn/ui configuration (New York style, RSC enabled)
- `lib/utils.ts`: cn() utility function

## 4. Problem Solving

### Problem 1: Missing Citation Number Mapping
**Issue**: The original plan had chunks with citation markers `[1]`, `[2]` in text, but the citations table only stored `source_chunk_id → target_chunk_id`. How would the system know which citation number corresponds to which chunk?

**User's Question**: "How do they know that this cited number corresponds to which target chunk?"

**Solution**: Added `citation_marker TEXT` column to the citations table. Now each citation edge stores the marker (e.g., `[1]`) along with the source and target chunk IDs.

### Problem 2: Clarifying Citation Direction
**Issue**: Confusion about "source" vs "target" in citations table.

**Clarification**:
- `source_chunk_id`: The chunk that contains the citation (does the citing)
- `target_chunk_id`: The chunk being cited (what the citation points to)
- Arrow: source cites → target

### Problem 3: Data Volume
**User Request**: "Double the content for all chunks" and ensure Stage 2 shows mixed patterns.

**Solution**:
- Increased from 12 chunks to 22 chunks (10+8+4)
- Created varied citation patterns showing Stage 2 citing both Stage 1 and Stage 0
- Updated all success criteria to match new counts

## 5. Pending Tasks

**No explicit pending tasks**. The implementation plan is complete and ready for execution. The plan follows the `/vignesh-implement` template with:
- 8 phases (some with subphases)
- Detailed file paths, code skeletons, success criteria
- Implementation notes sections for executor to fill in
- Sequential execution workflow

## 6. Current Work

**Most Recent Work**: Finalizing the implementation plan updates based on user feedback.

The last series of edits involved:
1. Adding `citation_marker` column to citations table schema
2. Expanding seed data from 12 to 22 chunks
3. Creating mixed citation patterns for Stage 2 (citing both Stage 1 and Stage 0)
4. Updating demo report to cite the 4 Stage 2 insights
5. Removing all Stage 3 references throughout the plan
6. Updating success criteria and README content

**Final State**:
- Implementation plan saved at `.claude/plan/citation-lineage-demo.md`
- Plan includes 22 chunks total: 10 Stage 0 (raw), 8 Stage 1 (insights), 4 Stage 2 (synthesis)
- 23 citation edges total: 8 from Stage 1→0, 15 from Stage 2→(1+0)
- Stage 2 demonstrates mixed citations: each synthesis insight cites both Stage 1 insights and Stage 0 raw data directly

**Example of Mixed Citation Pattern** (from the plan):
```javascript
// ins_strategic_analysis_chunk_1 shows:
// - 2 Stage 1 citations (which themselves cite Stage 0)
// - 1 Stage 0 citation (direct to raw data)
{ source: 'ins_strategic_analysis_chunk_1', target: 'ins_market_trends_chunk_1', marker: '[1]' },
{ source: 'ins_strategic_analysis_chunk_1', target: 'ins_customer_sentiment_chunk_3', marker: '[2]' },
{ source: 'ins_strategic_analysis_chunk_1', target: 'raw_competitor_report_chunk_2', marker: '[3]' },
```

This creates lineage: Stage 2 → Stage 1 → Stage 0 AND Stage 2 → Stage 0 in the same tree.

## 7. Optional Next Step

**Status**: Planning phase is COMPLETE. Implementation plan is ready for execution.

**User's Last Message**: The user ran `/summarise` command, indicating they want a summary before proceeding.

**No immediate next step** - awaiting user confirmation to begin implementation. The plan is structured for sequential execution starting with Phase 1a (Database Schema and Connection).

**If user wants to proceed**, the next action would be:
- Start Phase 1a: Create `db/schema.sql` and `db/index.ts` files
- User quote: "Yup, your recommended approach makes sense. And usually, the chunks have more information, so I think we can just double the content for all the chunks. and just do stages 0 to 2 will do. dont need to do stage 3. and ensure that for stage 2, it cites both insights from stage 1 and also the raw data sources from stage 0."

This has been fully implemented in the plan, so execution can begin when user confirms.
