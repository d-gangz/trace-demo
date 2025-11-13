<!--
Document Type: Guide
Purpose: Setup and usage instructions for Citation Lineage Demo
Context: Multi-hop citation tracking prototype for research insights
Key Topics: Installation, database setup, architecture, testing
Target Use: Getting started guide for developers
-->

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

2. Initialize database and seed data:
   ```bash
   npx tsx db/seed.ts
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

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Main demo page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── citation-link.tsx # Interactive citation markers
│   ├── citation-popover.tsx # Citation preview popover
│   ├── insight-report.tsx # Markdown renderer with citations
│   ├── lineage-tree.tsx  # Recursive tree visualization
│   └── lineage-sheet.tsx # Side sheet container
├── actions/              # Next.js server actions
│   ├── lineage.ts       # Lineage fetching actions
│   └── demo-data.ts     # Demo report content
├── db/                   # Database layer
│   ├── schema.sql       # SQLite schema
│   ├── index.ts         # Database connection & queries
│   └── seed.ts          # Seed data generator
└── lib/                  # Utilities
    ├── types.ts         # TypeScript interfaces
    └── markdown-utils.ts # Citation parsing utilities
```

## Development

```bash
# Type checking
bun run tsc --noEmit

# Production build
bun run build

# Start production server
bun run start

# Reseed database
npx tsx db/seed.ts
```
