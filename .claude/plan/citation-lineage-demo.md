**📁 Save this plan to**: `/.claude/plan/citation-lineage-demo.md`

---

# Citation Lineage Demo: Multi-Hop Citation Tracking for Research Insights

**Status**: Draft
**Created**: 2025-01-13
**Author**: Claude Code

## Overview

This project builds a prototype demonstrating citation lineage tracking for AI-powered research insights. The core problem being solved is the "citation verification nightmare" where consulting firms need to trace how insights compound across multiple analysis stages, from raw data sources through various synthesis levels.

The system stores all data as chunks (both raw data and insights) in a SQLite database, with citations tracked as edges in a separate table. Users can hover over inline citation markers (e.g., `[1]`, `[2]`) to see immediate source previews, then click "View Full" to open a side sheet displaying the complete citation lineage tree using recursive SQL queries.

This is a frontend-focused demo using Next.js 16 with shadcn/ui components, server actions for backend logic, and SQLite for data storage. The demo showcases 3 stages of citation compounding: Stage 0 (raw data with 10 chunks) → Stage 1 (first-order insights with 8 chunks) → Stage 2 (synthesis insights with 4 chunks that cite BOTH Stage 1 and Stage 0, demonstrating mixed citation patterns).

## Goals

✅ Display markdown insights report with interactive inline citations
✅ Hover citation → show popover with immediate source preview
✅ Click "View Full" → open side sheet with complete vertical lineage tree
✅ Demonstrate multi-hop citation chains (Stage 2 → 1 → 0)
✅ Show mixed citation patterns (Stage 2 citing both Stage 1 insights and Stage 0 raw data)
✅ Visual distinction between raw data (📄) and insights (📊) with stage badges
✅ Use server actions (not API routes) for data fetching
✅ All data stored as chunks with chunk_ids in SQLite

## Non-Goals

❌ Vector database or semantic search capabilities (simplified to SQLite only)
❌ Insight authoring workflow or citation picker UI (display-only demo)
❌ User authentication or multi-tenancy
❌ Real-time collaboration features
❌ Export functionality (PDF, Word, etc.)
❌ Confidence scoring or supersession handling (future features)

---

## Phase 1: Database Foundation

**Goal**: Set up SQLite database with schema, connection utilities, and seed data for the demo

---

### Phase 1a: Database Schema and Connection

**Goal**: Create database schema and connection utilities without seed data

#### Files to Create

- `db/schema.sql`

  - SQL schema for `content` and `citations` tables with indexes

- `db/index.ts`

  - Database connection singleton using better-sqlite3
  - Migration runner function
  - Query helper functions (getChunk, getDirectCitations, getFullLineage)

- `.gitignore` (modify)
  - Add `data/trace-demo.db` to gitignore

#### Files to Modify

- `package.json`
  - Will be modified by bun commands (no manual edits needed)

#### Files to Read/Reference

- `references/database-workflow-examples.md` (lines 49-75: PostgreSQL schema structure)
- `references/database-workflow-examples.md` (lines 543-650: Recursive CTE examples)

#### What to Build

**db/schema.sql:**

```sql
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
```

**db/index.ts:**

```typescript
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
```

#### Tests to Write

No automated tests for this phase. Manual verification via success criteria commands.

#### Success Criteria

- [ ] Run `bun add better-sqlite3 && bun add -d @types/better-sqlite3` - packages install successfully
- [ ] Run `mkdir -p data && mkdir -p db` - directories created
- [ ] Create `db/schema.sql` - file contains all tables and indexes
- [ ] Create `db/index.ts` - file compiles without TypeScript errors (`bun run tsc --noEmit`)
- [ ] Run `node -e "require('./db/index.ts').initDb()"` or equivalent - database file created at `data/trace-demo.db`
- [ ] Add `data/trace-demo.db` to `.gitignore` - file is gitignored

#### Implementation Notes

[EXECUTOR FILLS THIS IN AFTER COMPLETING PHASE 1a]

**Completed**: [Date]

**What was implemented**:

**Key learnings**:

**Challenges encountered**:

---

### Phase 1b: Seed Data Generation

**Goal**: Create seed script to populate database with realistic multi-stage citation data

#### Files to Create

- `db/seed.ts`
  - Seed data generator with 4 stages of chunks
  - Citation relationships between chunks
  - Executable script that clears and repopulates database

#### Files to Modify

- `package.json`
  - Add script: `"seed": "bun run db/seed.ts"`

#### Files to Read/Reference

- `db/index.ts` (lines 1-50: database utilities)
- `references/database-workflow-examples.md` (lines 85-250: sample data examples)
- `references/insights-process.md` (lines 13-43: citation format with chunk_ids)

#### What to Build

**db/seed.ts:**

```typescript
import { getDb, initDb } from "./index";

function seed() {
  // Initialize database schema
  initDb();

  const db = getDb();

  // Clear existing data
  db.prepare("DELETE FROM citations").run();
  db.prepare("DELETE FROM content").run();

  console.log("🗑️  Cleared existing data");

  // ===== STAGE 0: Raw Data Chunks (10 total) =====
  const stage0 = [
    {
      chunk_id: "raw_market_survey_chunk_1",
      text: "Q3 2024 market survey reveals 78% adoption rate of AI-powered analytics tools across enterprise segments, up from 52% in Q2 2024. Survey methodology: 500 enterprise decision-makers across technology, finance, and healthcare sectors.",
      stage: 0,
      type: "raw",
      source_title: "Enterprise AI Adoption Survey Q3 2024",
      created_at: "2024-10-15T09:00:00Z",
    },
    {
      chunk_id: "raw_competitor_report_chunk_2",
      text: "Competitor analysis indicates that CompanyX holds 45% market share in the AI analytics segment, followed by CompanyY at 28% and emerging players at 27%. CompanyX strength lies in enterprise integration capabilities.",
      stage: 0,
      type: "raw",
      source_title: "Market Intelligence Report: AI Analytics Vendors",
      created_at: "2024-10-18T14:30:00Z",
    },
    {
      chunk_id: "raw_customer_feedback_chunk_3",
      text: "Customer satisfaction scores show 32% year-over-year improvement, with NPS increasing from 42 to 56. Primary satisfaction drivers: ease of integration (89%), accuracy of insights (86%), and support responsiveness (82%).",
      stage: 0,
      type: "raw",
      source_title: "Customer Satisfaction Analysis Q3 2024",
      created_at: "2024-10-20T11:15:00Z",
    },
    {
      chunk_id: "raw_industry_analysis_chunk_4",
      text: "Industry forecast projects 18% CAGR for AI analytics market through 2028, driven by increasing data volumes, regulatory compliance requirements, and competitive pressure for data-driven decision making.",
      stage: 0,
      type: "raw",
      source_title: "Gartner Industry Forecast 2024-2028",
      created_at: "2024-10-22T08:45:00Z",
    },
    {
      chunk_id: "raw_financial_data_chunk_5",
      text: "Financial performance: Revenue growth of 24% YoY in Q3 2024, reaching $145M. EBITDA margin improved from 18% to 22%. Customer acquisition cost decreased 15% while lifetime value increased 31%.",
      stage: 0,
      type: "raw",
      source_title: "Q3 2024 Financial Report",
      created_at: "2024-10-25T16:00:00Z",
    },
    {
      chunk_id: "raw_tech_trends_chunk_6",
      text: "Technology adoption patterns show 67% of enterprises now using cloud-based analytics platforms, up from 45% in 2023. Migration drivers: scalability (91%), cost reduction (78%), and remote workforce enablement (72%).",
      stage: 0,
      type: "raw",
      source_title: "Cloud Analytics Adoption Report 2024",
      created_at: "2024-10-26T10:00:00Z",
    },
    {
      chunk_id: "raw_pricing_analysis_chunk_7",
      text: "Pricing strategy analysis reveals average contract value increased 18% YoY to $285K annually. Enterprise tier adoption grew 34%, while SMB segment showed 12% growth. Upsell rate reached 41% of existing customer base.",
      stage: 0,
      type: "raw",
      source_title: "Pricing and Revenue Analysis Q3 2024",
      created_at: "2024-10-27T13:20:00Z",
    },
    {
      chunk_id: "raw_security_compliance_chunk_8",
      text: "Security audit reports 99.97% uptime and zero critical security incidents in Q3 2024. SOC 2 Type II certified, GDPR compliant, and ISO 27001 certified. Data encryption at rest and in transit using AES-256.",
      stage: 0,
      type: "raw",
      source_title: "Security and Compliance Audit Q3 2024",
      created_at: "2024-10-28T09:30:00Z",
    },
    {
      chunk_id: "raw_user_engagement_chunk_9",
      text: "User engagement metrics: Daily active users increased 42% QoQ, average session duration up 28% to 34 minutes, and feature adoption rate at 73% for newly released capabilities. Power users (20% of base) generate 68% of queries.",
      stage: 0,
      type: "raw",
      source_title: "Product Analytics Dashboard Q3 2024",
      created_at: "2024-10-29T15:45:00Z",
    },
    {
      chunk_id: "raw_market_expansion_chunk_10",
      text: "Geographic expansion analysis: North America 52% of revenue, EMEA 31%, APAC 17%. Fastest growth in APAC (+89% YoY), driven by Singapore, Japan, and Australia markets. Regulatory approval obtained in 8 new countries.",
      stage: 0,
      type: "raw",
      source_title: "Geographic Market Analysis 2024",
      created_at: "2024-10-30T11:00:00Z",
    },
  ];

  // ===== STAGE 1: First-Order Insights (8 total) =====
  const stage1 = [
    {
      chunk_id: "ins_market_trends_chunk_1",
      text: "Market adoption has accelerated significantly, with enterprise AI analytics adoption reaching 78% in Q3 2024[1]. This 26 percentage point increase from Q2 indicates rapid mainstream adoption beyond early adopters. The growth is particularly pronounced in regulated industries where data-driven compliance has become mandatory.",
      stage: 1,
      type: "insight",
      author: "sarah.chen@consulting.com",
      created_at: "2024-10-28T10:30:00Z",
    },
    {
      chunk_id: "ins_competitive_position_chunk_2",
      text: "Current market structure shows clear leader-challenger dynamics, with CompanyX commanding 45% share through superior enterprise integration[1]. However, the 27% held by emerging players suggests market consolidation pressure and potential disruption risk from specialized entrants.",
      stage: 1,
      type: "insight",
      author: "michael.rodriguez@consulting.com",
      created_at: "2024-10-29T14:20:00Z",
    },
    {
      chunk_id: "ins_customer_sentiment_chunk_3",
      text: "Customer satisfaction improvements of 32% YoY with NPS rising to 56[1] signal strong product-market fit. Integration ease emerges as the dominant value driver (89% satisfaction), indicating that technical compatibility outweighs pure analytical capabilities in purchase decisions.",
      stage: 1,
      type: "insight",
      author: "sarah.chen@consulting.com",
      created_at: "2024-10-30T09:15:00Z",
    },
    {
      chunk_id: "ins_financial_performance_chunk_4",
      text: "Financial metrics demonstrate healthy unit economics with 24% revenue growth and margin expansion from 18% to 22%[1]. The simultaneous 15% CAC reduction and 31% LTV increase indicates improving operational efficiency and product stickiness.",
      stage: 1,
      type: "insight",
      author: "james.wilson@consulting.com",
      created_at: "2024-10-31T11:45:00Z",
    },
    {
      chunk_id: "ins_cloud_migration_chunk_5",
      text: "Cloud platform adoption reached 67% in 2024, up from 45% in 2023[1], representing a fundamental shift in enterprise infrastructure strategy. The primary migration drivers—scalability (91%), cost reduction (78%), and remote workforce enablement (72%)—align with broader digital transformation priorities.",
      stage: 1,
      type: "insight",
      author: "david.park@consulting.com",
      created_at: "2024-11-01T10:00:00Z",
    },
    {
      chunk_id: "ins_pricing_strategy_chunk_6",
      text: "Revenue per customer increased 18% YoY to $285K annually[1], driven primarily by enterprise tier growth of 34%. The 41% upsell rate among existing customers indicates strong value realization and expansion opportunities within the installed base.",
      stage: 1,
      type: "insight",
      author: "maria.gonzalez@consulting.com",
      created_at: "2024-11-01T14:30:00Z",
    },
    {
      chunk_id: "ins_product_engagement_chunk_7",
      text: "User engagement patterns show 42% QoQ growth in daily active users with session duration increasing to 34 minutes[1]. The concentration of activity among power users (20% generating 68% of queries) suggests successful cultivation of high-value user segments.",
      stage: 1,
      type: "insight",
      author: "robert.kim@consulting.com",
      created_at: "2024-11-02T09:20:00Z",
    },
    {
      chunk_id: "ins_geographic_expansion_chunk_8",
      text: "Geographic revenue distribution shows mature North American market (52%) balanced by high-growth APAC region (+89% YoY)[1]. Regulatory approvals in 8 new countries and strong traction in Singapore, Japan, and Australia markets validate international expansion strategy.",
      stage: 1,
      type: "insight",
      author: "emily.wong@consulting.com",
      created_at: "2024-11-02T13:15:00Z",
    },
  ];

  // ===== STAGE 2: Synthesis Insights (4 total - citing BOTH Stage 1 AND Stage 0) =====
  const stage2 = [
    {
      chunk_id: "ins_strategic_analysis_chunk_1",
      text: 'The convergence of strong market adoption (78%)[1] and improving customer satisfaction (32% increase)[2] suggests sustainable competitive positioning. However, direct competitor analysis[3] indicates vulnerability to specialized entrants in the 27% "emerging player" segment, particularly if they solve the integration challenge that drives current satisfaction.',
      stage: 2,
      type: "insight",
      author: "elena.popov@consulting.com",
      created_at: "2024-11-03T13:30:00Z",
    },
    {
      chunk_id: "ins_growth_opportunity_chunk_2",
      text: "The 18% CAGR industry forecast[1] combined with demonstrated financial performance (24% revenue growth)[2] and strong customer retention[3] creates a favorable growth environment. Geographic expansion showing 89% growth in APAC[4] indicates successful international scaling capabilities.",
      stage: 2,
      type: "insight",
      author: "david.kim@consulting.com",
      created_at: "2024-11-03T15:00:00Z",
    },
    {
      chunk_id: "ins_product_market_fit_chunk_3",
      text: "Product engagement patterns reveal strong value realization, with 42% DAU growth[1] and 41% upsell rates[2]. Cloud migration trends (67% adoption)[3] align with our platform architecture, while enterprise security requirements[4] match our SOC 2 Type II and ISO 27001 certifications.",
      stage: 2,
      type: "insight",
      author: "lisa.thompson@consulting.com",
      created_at: "2024-11-04T10:20:00Z",
    },
    {
      chunk_id: "ins_competitive_moat_chunk_4",
      text: "Competitive positioning shows defensible advantages: integration capabilities drive 89% satisfaction scores[1], pricing power evidenced by 18% ACV increase[2], and enterprise credibility from security certifications[3]. The 45% market share leader position[4] provides scale advantages in R&D and sales efficiency.",
      stage: 2,
      type: "insight",
      author: "alex.martinez@consulting.com",
      created_at: "2024-11-04T14:45:00Z",
    },
  ];

  // Insert all chunks
  const insertStmt = db.prepare(`
    INSERT INTO content (chunk_id, text, stage, type, author, created_at, source_title, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  [...stage0, ...stage1, ...stage2].forEach((chunk) => {
    insertStmt.run(
      chunk.chunk_id,
      chunk.text,
      chunk.stage,
      chunk.type,
      chunk.author || null,
      chunk.created_at || null,
      chunk.source_title || null,
      "published"
    );
  });

  console.log("✅ Inserted chunks:", {
    "Stage 0 (raw)": stage0.length,
    "Stage 1 (insights)": stage1.length,
    "Stage 2 (synthesis)": stage2.length,
    Total: stage0.length + stage1.length + stage2.length,
  });

  // ===== CITATIONS =====
  const citations = [
    // Stage 1 → Stage 0 (each Stage 1 insight cites one Stage 0 raw data)
    {
      source: "ins_market_trends_chunk_1",
      target: "raw_market_survey_chunk_1",
      marker: "[1]",
    },
    {
      source: "ins_competitive_position_chunk_2",
      target: "raw_competitor_report_chunk_2",
      marker: "[1]",
    },
    {
      source: "ins_customer_sentiment_chunk_3",
      target: "raw_customer_feedback_chunk_3",
      marker: "[1]",
    },
    {
      source: "ins_financial_performance_chunk_4",
      target: "raw_financial_data_chunk_5",
      marker: "[1]",
    },
    {
      source: "ins_cloud_migration_chunk_5",
      target: "raw_tech_trends_chunk_6",
      marker: "[1]",
    },
    {
      source: "ins_pricing_strategy_chunk_6",
      target: "raw_pricing_analysis_chunk_7",
      marker: "[1]",
    },
    {
      source: "ins_product_engagement_chunk_7",
      target: "raw_user_engagement_chunk_9",
      marker: "[1]",
    },
    {
      source: "ins_geographic_expansion_chunk_8",
      target: "raw_market_expansion_chunk_10",
      marker: "[1]",
    },

    // Stage 2 → Mixed (Stage 1 insights + Stage 0 raw data)

    // ins_strategic_analysis_chunk_1 cites: 2 Stage 1 + 1 Stage 0
    {
      source: "ins_strategic_analysis_chunk_1",
      target: "ins_market_trends_chunk_1",
      marker: "[1]",
    },
    {
      source: "ins_strategic_analysis_chunk_1",
      target: "ins_customer_sentiment_chunk_3",
      marker: "[2]",
    },
    {
      source: "ins_strategic_analysis_chunk_1",
      target: "raw_competitor_report_chunk_2",
      marker: "[3]",
    },

    // ins_growth_opportunity_chunk_2 cites: 2 Stage 1 + 2 Stage 0
    {
      source: "ins_growth_opportunity_chunk_2",
      target: "raw_industry_analysis_chunk_4",
      marker: "[1]",
    },
    {
      source: "ins_growth_opportunity_chunk_2",
      target: "ins_financial_performance_chunk_4",
      marker: "[2]",
    },
    {
      source: "ins_growth_opportunity_chunk_2",
      target: "ins_customer_sentiment_chunk_3",
      marker: "[3]",
    },
    {
      source: "ins_growth_opportunity_chunk_2",
      target: "ins_geographic_expansion_chunk_8",
      marker: "[4]",
    },

    // ins_product_market_fit_chunk_3 cites: 2 Stage 1 + 2 Stage 0
    {
      source: "ins_product_market_fit_chunk_3",
      target: "ins_product_engagement_chunk_7",
      marker: "[1]",
    },
    {
      source: "ins_product_market_fit_chunk_3",
      target: "ins_pricing_strategy_chunk_6",
      marker: "[2]",
    },
    {
      source: "ins_product_market_fit_chunk_3",
      target: "raw_tech_trends_chunk_6",
      marker: "[3]",
    },
    {
      source: "ins_product_market_fit_chunk_3",
      target: "raw_security_compliance_chunk_8",
      marker: "[4]",
    },

    // ins_competitive_moat_chunk_4 cites: 1 Stage 1 + 3 Stage 0
    {
      source: "ins_competitive_moat_chunk_4",
      target: "ins_customer_sentiment_chunk_3",
      marker: "[1]",
    },
    {
      source: "ins_competitive_moat_chunk_4",
      target: "raw_pricing_analysis_chunk_7",
      marker: "[2]",
    },
    {
      source: "ins_competitive_moat_chunk_4",
      target: "raw_security_compliance_chunk_8",
      marker: "[3]",
    },
    {
      source: "ins_competitive_moat_chunk_4",
      target: "raw_competitor_report_chunk_2",
      marker: "[4]",
    },
  ];

  const citationStmt = db.prepare(`
    INSERT INTO citations (source_chunk_id, target_chunk_id, citation_marker, relationship_type)
    VALUES (?, ?, ?, 'cites')
  `);

  citations.forEach(({ source, target, marker }) => {
    citationStmt.run(source, target, marker);
  });

  console.log(`✅ Inserted ${citations.length} citation edges`);
  console.log("🎉 Database seeded successfully!");
}

// Run seed if executed directly
if (import.meta.main) {
  seed();
}

export { seed };
```

**package.json (add script):**

```json
{
  "scripts": {
    "seed": "bun run db/seed.ts"
  }
}
```

#### Tests to Write

No automated tests. Manual verification via success criteria.

#### Success Criteria

- [ ] Create `db/seed.ts` - file compiles without errors
- [ ] Run `bun run seed` - script executes successfully with console output showing chunk counts
- [ ] Run `bun run db/seed.ts` (direct execution) - same result as above
- [ ] Verify database: `sqlite3 data/trace-demo.db "SELECT COUNT(*) FROM content"` - returns 22 (10 raw + 8 stage1 + 4 stage2)
- [ ] Verify citations: `sqlite3 data/trace-demo.db "SELECT COUNT(*) FROM citations"` - returns 23 edges (8 from Stage 1 + 15 from Stage 2)
- [ ] Verify citation_marker: `sqlite3 data/trace-demo.db "SELECT source_chunk_id, citation_marker, target_chunk_id FROM citations LIMIT 5"` - returns rows with citation markers
- [ ] Test Stage 2 mixed citations: `sqlite3 data/trace-demo.db "SELECT * FROM citations WHERE source_chunk_id = 'ins_strategic_analysis_chunk_1'"` - returns 3 rows (2 Stage 1 + 1 Stage 0)

#### Implementation Notes

[EXECUTOR FILLS THIS IN AFTER COMPLETING PHASE 1b]

**Completed**: [Date]

**What was implemented**:

**Key learnings**:

**Challenges encountered**:

---

## Phase 2: Server Actions and Type Definitions

**Goal**: Create server actions for data fetching and TypeScript interfaces for type safety

### Files to Create

- `actions/lineage.ts`

  - Server actions: getChunk, getDirectCitations, getFullLineage, buildLineageTree

- `lib/types.ts`

  - TypeScript interfaces: Chunk, Citation, LineageNode, LineageTree

- `actions/demo-data.ts`
  - Server action to get demo report content

### Files to Modify

None

### Files to Read/Reference

- `db/index.ts` (lines 1-100: database query functions)
- `references/database-workflow-examples.md` (lines 660-730: tree building logic)

### What to Build

**lib/types.ts:**

```typescript
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
```

**actions/lineage.ts:**

```typescript
"use server";

import {
  getDb,
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
```

**actions/demo-data.ts:**

```typescript
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
```

### Tests to Write

No automated tests. Manual verification via success criteria.

### Success Criteria

- [ ] Create `lib/types.ts` - compiles without TypeScript errors
- [ ] Create `actions/lineage.ts` - compiles without TypeScript errors
- [ ] Create `actions/demo-data.ts` - compiles without TypeScript errors
- [ ] Run `bun run tsc --noEmit` - no type errors
- [ ] Test server action in Node REPL or test file: call `getChunk('raw_market_survey_chunk_1')` - returns chunk object
- [ ] Test: call `getFullLineage('ins_executive_summary_chunk_1')` - returns array of LineageNode objects

### Implementation Notes

[EXECUTOR FILLS THIS IN AFTER COMPLETING PHASE 2]

**Completed**: [Date]

**What was implemented**:

**Key learnings**:

**Challenges encountered**:

---

## Phase 3: shadcn UI Components Setup

**Goal**: Install and configure necessary shadcn/ui components

### Files to Create

Multiple files will be created in `components/ui/` by shadcn CLI

### Files to Modify

- `package.json` (via bun commands)
- `components.json` (already exists, may be updated)

### Files to Read/Reference

- `components.json` (lines 1-20: shadcn config)

### Preparation Step

Before implementing this phase, invoke the `skill-agent` (subagent) and ask it to use the `shadcn` skill to understand how to use shadcn to build out our frontend (please give it the instructions on the frontend that we are building). This will provide best practices and patterns for working with shadcn/ui components.

### What to Build

Run the following commands in sequence:

```bash
bunx --bun shadcn@latest add card
bunx --bun shadcn@latest add badge
bunx --bun shadcn@latest add sheet
bunx --bun shadcn@latest add popover
bunx --bun shadcn@latest add separator
bunx --bun shadcn@latest add button
```

This will create:

- `components/ui/card.tsx`
- `components/ui/badge.tsx`
- `components/ui/sheet.tsx`
- `components/ui/popover.tsx`
- `components/ui/separator.tsx`
- `components/ui/button.tsx`

### Tests to Write

No tests. Verification via successful imports.

### Success Criteria

- [ ] Run all 6 shadcn add commands - each completes successfully
- [ ] Verify `components/ui/` directory exists with 6+ component files
- [ ] Run `bun run tsc --noEmit` - no TypeScript errors
- [ ] Check imports: create test file that imports all UI components - compiles without errors

### Implementation Notes

[EXECUTOR FILLS THIS IN AFTER COMPLETING PHASE 3]

**Completed**: [Date]

**What was implemented**:

**Key learnings**:

**Challenges encountered**:

---

## Phase 4: React Markdown Setup and Citation Parsing

**Goal**: Install react-markdown and create utility to parse markdown with citations

### Files to Create

- `lib/markdown-utils.ts`
  - Functions to parse citation markers and build citation map from markdown

### Files to Modify

- `package.json` (via bun command)

### Files to Read/Reference

- `references/insights-process.md` (lines 145-195: citation parsing logic)

### What to Build

**Install dependencies:**

```bash
bun add react-markdown remark-gfm
```

**lib/markdown-utils.ts:**

```typescript
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
```

### Tests to Write

No automated tests. Manual verification.

### Success Criteria

- [ ] Run `bun add react-markdown remark-gfm` - packages installed
- [ ] Create `lib/markdown-utils.ts` - file compiles without errors
- [ ] Run `bun run tsc --noEmit` - no TypeScript errors
- [ ] Test parseCitationMap with sample markdown - returns correct map object
- [ ] Test extractCitationMarkers with text containing `[1]`, `[2]` - returns array `["[1]", "[2]"]`

### Implementation Notes

[EXECUTOR FILLS THIS IN AFTER COMPLETING PHASE 4]

**Completed**: [Date]

**What was implemented**:

**Key learnings**:

**Challenges encountered**:

---

## Phase 5: Citation Components

**Goal**: Build citation interaction components (CitationLink, CitationPopover)

---

### Phase 5a: CitationLink and CitationPopover Components

**Goal**: Create hoverable citation markers with popover preview

#### Files to Create

- `components/citation-link.tsx`

  - Clickable/hoverable citation marker component

- `components/citation-popover.tsx`
  - Popover showing immediate source with "View Full" button

#### Files to Modify

None

#### Files to Read/Reference

- `components/ui/popover.tsx` (shadcn Popover component)
- `components/ui/badge.tsx` (shadcn Badge component)
- `components/ui/button.tsx` (shadcn Button component)
- `lib/types.ts` (Chunk interface)

#### What to Build

**components/citation-link.tsx:**

```typescript
"use client";

import { useState } from "react";
import { CitationPopover } from "./citation-popover";
import type { Chunk } from "@/lib/types";

interface CitationLinkProps {
  marker: string; // e.g., "[1]"
  chunkId: string;
  chunk: Chunk | null;
  onViewFull: (chunkId: string) => void;
}

export function CitationLink({
  marker,
  chunkId,
  chunk,
  onViewFull,
}: CitationLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <CitationPopover
      open={open}
      onOpenChange={setOpen}
      marker={marker}
      chunk={chunk}
      onViewFull={() => {
        setOpen(false);
        onViewFull(chunkId);
      }}
    >
      <span
        className="cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => onViewFull(chunkId)}
      >
        {marker}
      </span>
    </CitationPopover>
  );
}
```

**components/citation-popover.tsx:**

```typescript
"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Chunk } from "@/lib/types";

interface CitationPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marker: string;
  chunk: Chunk | null;
  onViewFull: () => void;
  children: React.ReactNode;
}

export function CitationPopover({
  open,
  onOpenChange,
  marker,
  chunk,
  onViewFull,
  children,
}: CitationPopoverProps) {
  if (!chunk) {
    return <>{children}</>;
  }

  const stageBadgeColor =
    {
      0: "bg-gray-500 text-white",
      1: "bg-blue-500 text-white",
      2: "bg-purple-500 text-white",
    }[chunk.stage] || "bg-gray-500 text-white";

  const typeIcon = chunk.type === "raw" ? "📄" : "📊";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{typeIcon}</span>
              <Badge className={stageBadgeColor}>Stage {chunk.stage}</Badge>
              <span className="text-sm text-muted-foreground">{marker}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm line-clamp-3">{chunk.text}</p>

            {chunk.type === "raw" && chunk.source_title && (
              <p className="text-xs text-muted-foreground">
                Source: {chunk.source_title}
              </p>
            )}

            {chunk.author && (
              <p className="text-xs text-muted-foreground">
                Author: {chunk.author}
              </p>
            )}

            {chunk.created_at && (
              <p className="text-xs text-muted-foreground">
                Created: {new Date(chunk.created_at).toLocaleDateString()}
              </p>
            )}
          </div>

          <Separator />

          <Button onClick={onViewFull} className="w-full" size="sm">
            View Full Lineage
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

#### Tests to Write

No automated tests. Manual testing via browser.

#### Success Criteria

- [ ] Create `components/citation-link.tsx` - compiles without errors
- [ ] Create `components/citation-popover.tsx` - compiles without errors
- [ ] Run `bun run tsc --noEmit` - no TypeScript errors
- [ ] Components import all required shadcn UI components successfully
- [ ] Stage badge colors render correctly for stages 0-3

#### Implementation Notes

[EXECUTOR FILLS THIS IN AFTER COMPLETING PHASE 5a]

**Completed**: [Date]

**What was implemented**:

**Key learnings**:

**Challenges encountered**:

---

### Phase 5b: InsightReport Component with Citation Parsing

**Goal**: Create markdown renderer that wraps citations with CitationLink

#### Files to Create

- `components/insight-report.tsx`
  - Markdown renderer with citation parsing and replacement

#### Files to Modify

None

#### Files to Read/Reference

- `lib/markdown-utils.ts` (citation parsing functions)
- `components/citation-link.tsx` (CitationLink component)
- `actions/lineage.ts` (getChunk server action)

#### What to Build

**components/insight-report.tsx:**

```typescript
"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CitationLink } from "./citation-link";
import { parseCitationMap, extractCitationMarkers } from "@/lib/markdown-utils";
import { getChunk } from "@/actions/lineage";
import type { Chunk, CitationMap } from "@/lib/types";

interface InsightReportProps {
  markdown: string;
  onCitationClick: (chunkId: string) => void;
}

export function InsightReport({
  markdown,
  onCitationClick,
}: InsightReportProps) {
  const [citationMap, setCitationMap] = useState<CitationMap>({});
  const [chunks, setChunks] = useState<Record<string, Chunk | null>>({});

  // Parse citation map from markdown
  useEffect(() => {
    const map = parseCitationMap(markdown);
    setCitationMap(map);
  }, [markdown]);

  // Fetch chunks for all citations
  useEffect(() => {
    async function fetchChunks() {
      const chunkData: Record<string, Chunk | null> = {};

      for (const [marker, chunkId] of Object.entries(citationMap)) {
        const chunk = await getChunk(chunkId);
        chunkData[marker] = chunk;
      }

      setChunks(chunkData);
    }

    if (Object.keys(citationMap).length > 0) {
      fetchChunks();
    }
  }, [citationMap]);

  // Remove references section from display
  const contentWithoutReferences = markdown.split(/##\s+References/)[0];

  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom renderer for text nodes to replace citation markers
          p: ({ children, ...props }) => {
            return (
              <p {...props}>
                {processTextWithCitations(
                  children,
                  citationMap,
                  chunks,
                  onCitationClick
                )}
              </p>
            );
          },
        }}
      >
        {contentWithoutReferences}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Process text content and replace citation markers with CitationLink components
 */
function processTextWithCitations(
  children: React.ReactNode,
  citationMap: CitationMap,
  chunks: Record<string, Chunk | null>,
  onCitationClick: (chunkId: string) => void
): React.ReactNode {
  // Convert children to array
  const childArray = Array.isArray(children) ? children : [children];

  return childArray.map((child, index) => {
    if (typeof child !== "string") {
      return child;
    }

    // Find all citation markers in this text
    const markers = extractCitationMarkers(child);
    if (markers.length === 0) {
      return child;
    }

    // Split text by citation markers and insert CitationLink components
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    markers.forEach((marker) => {
      const markerIndex = child.indexOf(marker, lastIndex);
      if (markerIndex === -1) return;

      // Add text before marker
      if (markerIndex > lastIndex) {
        parts.push(child.substring(lastIndex, markerIndex));
      }

      // Add CitationLink component
      const chunkId = citationMap[marker];
      const chunk = chunks[marker] || null;

      parts.push(
        <CitationLink
          key={`${marker}-${index}`}
          marker={marker}
          chunkId={chunkId}
          chunk={chunk}
          onViewFull={onCitationClick}
        />
      );

      lastIndex = markerIndex + marker.length;
    });

    // Add remaining text
    if (lastIndex < child.length) {
      parts.push(child.substring(lastIndex));
    }

    return parts;
  });
}
```

#### Tests to Write

No automated tests. Manual browser testing.

#### Success Criteria

- [ ] Create `components/insight-report.tsx` - compiles without errors
- [ ] Run `bun run tsc --noEmit` - no TypeScript errors
- [ ] Component successfully imports ReactMarkdown and dependencies
- [ ] Citation parsing logic correctly extracts markers from text
- [ ] processTextWithCitations function splits text and inserts components correctly

#### Implementation Notes

[EXECUTOR FILLS THIS IN AFTER COMPLETING PHASE 5b]

**Completed**: [Date]

**What was implemented**:

**Key learnings**:

**Challenges encountered**:

---

## Phase 6: Lineage Tree Visualization

**Goal**: Build recursive tree component to display full citation lineage

---

### Phase 6a: LineageTree Component

**Goal**: Create recursive vertical tree renderer with icons and badges

#### Files to Create

- `components/lineage-tree.tsx`
  - Recursive tree renderer component

#### Files to Modify

None

#### Files to Read/Reference

- `lib/types.ts` (LineageNode interface)
- `components/ui/badge.tsx` (Badge component)
- `references/database-workflow-examples.md` (lines 730-800: tree visualization examples)

#### What to Build

**components/lineage-tree.tsx:**

```typescript
"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LineageNode } from "@/lib/types";

interface LineageTreeProps {
  nodes: LineageNode[];
  level?: number;
}

export function LineageTree({ nodes, level = 0 }: LineageTreeProps) {
  if (nodes.length === 0) return null;

  return (
    <div className="space-y-3">
      {nodes.map((node, index) => (
        <TreeNode
          key={node.chunk_id}
          node={node}
          level={level}
          isLast={index === nodes.length - 1}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  node: LineageNode;
  level: number;
  isLast: boolean;
}

function TreeNode({ node, level, isLast }: TreeNodeProps) {
  const { chunk, children } = node;

  const stageBadgeColor =
    {
      0: "bg-gray-500 text-white",
      1: "bg-blue-500 text-white",
      2: "bg-purple-500 text-white",
    }[chunk.stage] || "bg-gray-500 text-white";

  const typeIcon = chunk.type === "raw" ? "📄" : "📊";

  // Connection line styling
  const hasChildren = children.length > 0;

  return (
    <div className="relative">
      {/* Connection line from parent */}
      {level > 0 && (
        <div className="absolute left-0 top-0 w-4 h-6 border-l-2 border-b-2 border-gray-300 dark:border-gray-600" />
      )}

      {/* Node content */}
      <Card
        className={`p-4 ${
          level > 0 ? "ml-8" : ""
        } hover:shadow-md transition-shadow`}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">{typeIcon}</span>
            <Badge className={stageBadgeColor}>Stage {chunk.stage}</Badge>
            {chunk.type === "insight" && chunk.author && (
              <span className="text-xs text-muted-foreground">
                by {chunk.author.split("@")[0]}
              </span>
            )}
            {chunk.created_at && (
              <span className="text-xs text-muted-foreground">
                • {new Date(chunk.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed">{chunk.text}</p>

          {chunk.type === "raw" && chunk.source_title && (
            <p className="text-xs text-muted-foreground italic">
              Source: {chunk.source_title}
            </p>
          )}

          <p className="text-xs font-mono text-muted-foreground">
            {chunk.chunk_id}
          </p>
        </div>
      </Card>

      {/* Vertical line for children */}
      {hasChildren && (
        <div className="absolute left-4 top-6 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
      )}

      {/* Recursive render of children */}
      {hasChildren && (
        <div className="mt-3">
          <LineageTree nodes={children} level={level + 1} />
        </div>
      )}
    </div>
  );
}
```

#### Tests to Write

No automated tests. Visual verification in browser.

#### Success Criteria

- [ ] Create `components/lineage-tree.tsx` - compiles without errors
- [ ] Run `bun run tsc --noEmit` - no TypeScript errors
- [ ] Component correctly handles empty nodes array
- [ ] Recursive rendering works for nested children
- [ ] Connection lines render correctly with proper indentation

#### Implementation Notes

[EXECUTOR FILLS THIS IN AFTER COMPLETING PHASE 6a]

**Completed**: [Date]

**What was implemented**:

**Key learnings**:

**Challenges encountered**:

---

### Phase 6b: LineageSheet Component

**Goal**: Create side sheet that fetches and displays full lineage tree

#### Files to Create

- `components/lineage-sheet.tsx`
  - Side sheet container with lineage tree

#### Files to Modify

None

#### Files to Read/Reference

- `components/ui/sheet.tsx` (shadcn Sheet component)
- `components/lineage-tree.tsx` (LineageTree component)
- `actions/lineage.ts` (getFullLineage server action)

#### What to Build

**components/lineage-sheet.tsx:**

```typescript
"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LineageTree } from "./lineage-tree";
import { getChunk, getFullLineage } from "@/actions/lineage";
import type { Chunk, LineageNode } from "@/lib/types";

interface LineageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chunkId: string | null;
}

export function LineageSheet({
  open,
  onOpenChange,
  chunkId,
}: LineageSheetProps) {
  const [rootChunk, setRootChunk] = useState<Chunk | null>(null);
  const [lineage, setLineage] = useState<LineageNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLineage() {
      if (!chunkId) return;

      setLoading(true);
      try {
        // Fetch root chunk
        const chunk = await getChunk(chunkId);
        setRootChunk(chunk);

        // Fetch full lineage
        const lineageNodes = await getFullLineage(chunkId);
        setLineage(lineageNodes);
      } catch (error) {
        console.error("Error fetching lineage:", error);
      } finally {
        setLoading(false);
      }
    }

    if (open && chunkId) {
      fetchLineage();
    }
  }, [open, chunkId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Citation Lineage</SheetTitle>
          <SheetDescription>
            {rootChunk ? (
              <>
                Full citation chain for{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {rootChunk.chunk_id}
                </code>
              </>
            ) : (
              "Loading..."
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading lineage...</p>
          ) : lineage.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No citations found. This chunk does not cite any sources.
            </p>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                Found {lineage.length} citation{lineage.length !== 1 ? "s" : ""}{" "}
                in lineage
              </div>
              <LineageTree nodes={lineage} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

#### Tests to Write

No automated tests. Browser testing.

#### Success Criteria

- [ ] Create `components/lineage-sheet.tsx` - compiles without errors
- [ ] Run `bun run tsc --noEmit` - no TypeScript errors
- [ ] Component handles null chunkId gracefully
- [ ] Loading state displays correctly
- [ ] Empty lineage shows appropriate message
- [ ] Sheet opens/closes correctly with onOpenChange

#### Implementation Notes

[EXECUTOR FILLS THIS IN AFTER COMPLETING PHASE 6b]

**Completed**: [Date]

**What was implemented**:

**Key learnings**:

**Challenges encountered**:

---

## Phase 7: Main Demo Page Integration

**Goal**: Wire up all components in main page and test end-to-end functionality

### Files to Create

- `app/globals.css` (modify for custom styles if needed)

### Files to Modify

- `app/page.tsx`

  - Replace default content with demo

- `app/layout.tsx`
  - Update metadata

### Files to Read/Reference

- `app/layout.tsx` (lines 1-34: existing layout structure)
- `app/page.tsx` (lines 1-65: existing page structure)
- `components/insight-report.tsx` (InsightReport component)
- `components/lineage-sheet.tsx` (LineageSheet component)
- `actions/demo-data.ts` (getDemoReport server action)

### What to Build

**app/layout.tsx (update metadata):**

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Citation Lineage Demo",
  description: "Multi-hop citation tracking for research insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

**app/page.tsx:**

```typescript
"use client";

import { useEffect, useState } from "react";
import { InsightReport } from "@/components/insight-report";
import { LineageSheet } from "@/components/lineage-sheet";
import { getDemoReport } from "@/actions/demo-data";

export default function Home() {
  const [demoReport, setDemoReport] = useState("");
  const [selectedChunk, setSelectedChunk] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Load demo report
  useEffect(() => {
    async function loadReport() {
      const report = await getDemoReport();
      setDemoReport(report);
    }
    loadReport();
  }, []);

  const handleCitationClick = (chunkId: string) => {
    setSelectedChunk(chunkId);
    setSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 px-4 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Citation Lineage Demo</h1>
          <p className="text-muted-foreground">
            Hover over citations to see source preview, click "View Full" to
            explore complete lineage
          </p>
        </header>

        {demoReport ? (
          <div className="bg-card border rounded-lg p-6">
            <InsightReport
              markdown={demoReport}
              onCitationClick={handleCitationClick}
            />
          </div>
        ) : (
          <p className="text-muted-foreground">Loading report...</p>
        )}

        <LineageSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          chunkId={selectedChunk}
        />
      </main>
    </div>
  );
}
```

### Tests to Write

No automated tests. End-to-end manual testing.

### Success Criteria

- [ ] Update `app/layout.tsx` metadata - compiles without errors
- [ ] Update `app/page.tsx` with new content - compiles without errors
- [ ] Run `bun run tsc --noEmit` - no TypeScript errors
- [ ] Run `bun run dev` - server starts successfully
- [ ] Open `http://localhost:3000` - page loads without errors
- [ ] Page displays markdown report with blue clickable citations
- [ ] Hover citation - popover appears with source preview
- [ ] Click "View Full" button - side sheet opens
- [ ] Side sheet displays lineage tree with correct structure
- [ ] Close sheet - sheet closes correctly
- [ ] Test multiple citations - each shows correct lineage

### Implementation Notes

[EXECUTOR FILLS THIS IN AFTER COMPLETING PHASE 7]

**Completed**: [Date]

**What was implemented**:

**Key learnings**:

**Challenges encountered**:

---

## Phase 8: Polish and Final Testing

**Goal**: Add final touches, verify all functionality, and test edge cases

### Files to Create

- `.gitignore` (modify)

  - Ensure data/trace-demo.db is ignored

- `README.md` (create or update)
  - Project documentation

### Files to Modify

- Various component files for styling improvements (as needed)

### Files to Read/Reference

All previously created files for final review

### What to Build

**README.md:**

````markdown
# Citation Lineage Demo

Multi-hop citation tracking prototype for research insights.

## Features

- **Interactive Citations**: Hover to see source preview
- **Full Lineage View**: Click to explore complete citation chains
- **Multi-Stage Tracking**: Raw data → Insights → Synthesis → Executive summary
- **Visual Distinction**: Icons and badges distinguish raw data vs insights

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```
````

2. Initialize database and seed data:

   ```bash
   bun run seed
   ```

3. Start development server:

   ```bash
   bun run dev
   ```

4. Open http://localhost:3000

## Architecture

- **Database**: SQLite with `content` and `citations` tables
- **Backend**: Next.js Server Actions
- **Frontend**: React with shadcn/ui components
- **Citations**: Recursive SQL queries for lineage traversal

## Database Schema

- `content`: All chunks (raw + insights) with stage, type, author, etc.
- `citations`: Edges between chunks (source → target)

## Testing

Manual testing checklist:

1. Hover citations → popover appears
2. Click "View Full" → sheet opens with tree
3. Tree shows correct multi-hop lineage
4. Stage badges and icons display correctly
5. Dark mode works correctly

````

**Final tasks:**
1. Review all components for consistent styling
2. Test dark mode toggle (if applicable)
3. Verify responsive layout on mobile
4. Test all citation types (Stage 0→1, 1→2, 2→3)
5. Verify connection lines in tree render correctly
6. Test edge cases: no citations, single citation, many citations

### Tests to Write

No automated tests. Comprehensive manual testing.

### Success Criteria

- [ ] Create/update `README.md` with project documentation
- [ ] Verify `.gitignore` includes `data/trace-demo.db`
- [ ] Run `bun run build` - production build succeeds
- [ ] Run `bun run start` - production server runs successfully
- [ ] Test in production mode - all features work
- [ ] Test all citations in demo report - each opens correct lineage
- [ ] Test `ins_strategic_analysis_chunk_1` lineage - shows mixed citations (2 Stage 1 + 1 Stage 0)
- [ ] Test `ins_growth_opportunity_chunk_2` lineage - shows 2-hop chain (Stage 2 → Stage 1 → Stage 0)
- [ ] Verify stage badges: Stage 0=gray, 1=blue, 2=purple
- [ ] Verify icons: 📄 for raw, 📊 for insights
- [ ] Test responsive layout - works on mobile viewport
- [ ] Test dark mode - all components visible and styled correctly

### Implementation Notes

[EXECUTOR FILLS THIS IN AFTER COMPLETING PHASE 8]

**Completed**: [Date]

**What was implemented**:

**Key learnings**:

**Challenges encountered**:

---

## Testing Strategy Summary

### Manual Testing

This project relies on manual testing in the browser:

1. **Citation Interaction Testing**
   - Hover each citation marker
   - Verify popover content accuracy
   - Test "View Full" button

2. **Lineage Tree Testing**
   - Verify recursive structure
   - Check depth indicators
   - Confirm connection lines

3. **Edge Cases**
   - Empty lineage (raw data chunks)
   - Single citation
   - Multiple citations (3+)
   - Deep lineage (3+ hops)

4. **Visual Testing**
   - Dark mode compatibility
   - Responsive layout
   - Badge colors
   - Icon display

### Database Testing

Use SQLite CLI to verify:
```bash
# Count chunks by stage
sqlite3 data/trace-demo.db "SELECT stage, COUNT(*) FROM content GROUP BY stage"

# Verify citations
sqlite3 data/trace-demo.db "SELECT COUNT(*) FROM citations"

# Test recursive query
sqlite3 data/trace-demo.db "
WITH RECURSIVE lineage AS (
  SELECT target_chunk_id, 1 as depth
  FROM citations WHERE source_chunk_id = 'ins_executive_summary_chunk_1'
  UNION ALL
  SELECT c.target_chunk_id, l.depth + 1
  FROM citations c
  JOIN lineage l ON c.source_chunk_id = l.target_chunk_id
  WHERE l.depth < 10
)
SELECT * FROM lineage;
"
````

---

## Risk Mitigation

### Risk: SQLite Connection Issues

**Mitigation**:

- Use singleton pattern for database connection
- Add WAL mode for better concurrency
- Ensure data directory exists before connecting

### Risk: Citation Parsing Failures

**Mitigation**:

- Validate citation format in markdown
- Handle missing chunks gracefully
- Display error states in UI

### Risk: React Hydration Mismatches

**Mitigation**:

- Use 'use client' for interactive components
- Fetch data in useEffect hooks
- Handle loading states properly

### Risk: Performance with Deep Lineage

**Mitigation**:

- Limit recursive query depth to 10
- Use indexes on citations table
- Implement loading states

---

## References

### Key Files

- Database Schema: `db/schema.sql`
- Database Utils: `db/index.ts`
- Server Actions: `actions/lineage.ts`
- Main Page: `app/page.tsx`
- Citation Components: `components/citation-*.tsx`
- Tree Component: `components/lineage-tree.tsx`

### Reference Documents

- `references/traceability-v2.md` - Original design document
- `references/database-workflow-examples.md` - Database architecture and recursive CTE examples
- `references/insights-process.md` - Citation parsing and workflow

---

## EXECUTOR INSTRUCTIONS

### Phase-by-Phase Workflow

**Work sequentially. Do not skip phases or subphases.**

For each phase (or subphase if the phase has subphases):

1. **Implement**

   - Read "Files to Read/Reference" first
   - Build what's described in "What to Build"
   - Write all tests in "Tests to Write"
   - Run tests as you work

2. **Verify Success Criteria**

   - Check EVERY box in "Success Criteria"
   - Run EVERY command specified
   - **Only check when 100% complete** (not "mostly done")
   - All tests must pass, all commands must work

3. **Document Implementation Notes**

   - Fill in the "Implementation Notes" section with:
     - What was actually implemented
     - Deviations from plan (if any)
     - Key technical insights learned
     - Challenges encountered and solutions
     - Unexpected discoveries

4. **Move to next phase/subphase** (only after steps 2 and 3 complete). Stop after completion of each phase/subphase for the user to review. Only proceed to the next phase/subphase when user specifies to continue.

### Working with Subphases

When a phase has subphases (e.g., Phase 1a, 1b, 1c):

- **Treat each subphase as a mini-phase**: Complete all 4 steps above for each subphase
- **Stop after each subphase**: Wait for user review before proceeding to the next subphase
- **Complete all subphases before moving to next phase**: Don't skip from Phase 1a to Phase 2
- **Document each subphase separately**: Fill in Implementation Notes after each subphase completes

### Critical Rules

- ✅ Check box: 100% complete, all tests pass, commands work
- ❌ Don't check: Failing tests, partial work, unresolved errors
- 📝 Always fill Implementation Notes before next phase/subphase
- 🚫 Never skip ahead to later phases/subphases
- 🔄 Complete subphases sequentially (1a → 1b → 1c, not 1a → 1c)
