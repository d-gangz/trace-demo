<!--
Document Type: Implementation Plan
Purpose: Detailed shadcn/ui component implementation guide for citation lineage demo
Context: Created by skill-based-planner using shadcn skill
Key Topics: Component installation, composition patterns, interactive citations, tree visualization
Target Use: Execution guide for main agent to build frontend components
-->

# Implementation Plan: shadcn/ui Components for Citation Lineage Demo

## Overview

This plan provides detailed guidance for implementing the citation lineage demo frontend using shadcn/ui components. Based on shadcn skill best practices, this plan covers component installation, composition patterns, and interactive citation workflows using Card, Badge, Sheet, Popover, Separator, and Button components.

**Skills used**: shadcn (official shadcn/ui development patterns)

**Core principles from shadcn skill**:
- Components are copied to project, not installed as dependencies (customizable)
- Built on Radix UI primitives with full ARIA support
- Type-safe with full TypeScript support
- Composable - build complex UIs from simple primitives
- OKLCH color format for better perceptual uniformity

## Prerequisites

- Next.js 16 already initialized at `/Users/gang/alixp-work/trace-demo`
- shadcn/ui already configured (components.json exists with "new-york" style)
- Tailwind CSS configured with OKLCH color variables
- Project uses bun as package manager (not npm)

## Implementation Steps

### Step 1: Install Required shadcn/ui Components

**What to implement**: Add 6 core shadcn/ui components needed for the citation lineage demo

**How to implement**: Use `bunx --bun shadcn@latest add` command for each component (skill guidance: components are copied to project, not installed as dependencies)

**Why this approach**:
- shadcn/ui components are copied into your codebase (`components/ui/`), allowing full customization
- Using `bunx --bun` ensures compatibility with bun package manager
- Adding components individually provides better control and smaller bundle size

**Files to create**:
- `components/ui/card.tsx` - Container for tree nodes and report
- `components/ui/badge.tsx` - Stage indicators (Stage 0, 1, 2)
- `components/ui/sheet.tsx` - Side panel for full lineage view
- `components/ui/popover.tsx` - Citation hover previews
- `components/ui/separator.tsx` - Visual dividers
- `components/ui/button.tsx` - "View Full" action button

**Commands to execute**:
```bash
bunx --bun shadcn@latest add card
bunx --bun shadcn@latest add badge
bunx --bun shadcn@latest add sheet
bunx --bun shadcn@latest add popover
bunx --bun shadcn@latest add separator
bunx --bun shadcn@latest add button
```

**Validation**:
```bash
# Verify all component files exist
ls components/ui/card.tsx
ls components/ui/badge.tsx
ls components/ui/sheet.tsx
ls components/ui/popover.tsx
ls components/ui/separator.tsx
ls components/ui/button.tsx

# Verify no TypeScript errors
bun run tsc --noEmit
```

**Key patterns from shadcn skill**:
- Components will include Radix UI primitives (e.g., `@radix-ui/react-popover`)
- All components export using `cva` (class-variance-authority) for variant management
- Components support dark mode via OKLCH CSS variables automatically

---

### Step 2: Create CitationLink Component (Interactive Citation Marker)

**What to implement**: Clickable/hoverable citation markers that trigger popover on hover and full lineage on click

**How to implement**: Based on shadcn skill's overlay component patterns (Popover section)

**Why this approach**:
- Popover component provides controlled open/close state management
- Hover triggers use `onMouseEnter`/`onMouseLeave` for immediate preview
- Click action opens separate sheet for full lineage (composition pattern)

**Files to create**: `components/citation-link.tsx`

**Component structure** (following shadcn composition patterns):
```typescript
"use client";

import { useState } from "react";
import { CitationPopover } from "./citation-popover";
import type { Chunk } from "@/lib/types";

interface CitationLinkProps {
  marker: string;        // e.g., "[1]"
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

**Key patterns from shadcn skill**:
- Use `"use client"` directive for interactive components (Next.js best practice)
- Controlled component pattern: `open` state managed by parent
- OKLCH color classes: `dark:text-blue-400` uses CSS variables automatically
- Composition: Wraps trigger in CitationPopover component

**Validation**:
- Component compiles without TypeScript errors
- Supports both light and dark mode (OKLCH variables)
- Hover triggers popover state change
- Click invokes `onViewFull` callback

---

### Step 3: Create CitationPopover Component (Source Preview)

**What to implement**: Popover showing immediate source preview with stage badge, type icon, and "View Full" button

**How to implement**: Based on shadcn skill's Popover and Card composition patterns

**Why this approach**:
- Popover provides overlay positioning with proper ARIA support (Radix UI primitive)
- Badge component displays stage with custom OKLCH colors
- Separator provides visual hierarchy (skill pattern: "Use in layouts and forms")
- Button uses `asChild` pattern for custom trigger rendering

**Files to create**: `components/citation-popover.tsx`

**Component structure** (following shadcn overlay + feedback patterns):
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

  // Custom stage badge colors using OKLCH
  const stageBadgeColor = {
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

**Key patterns from shadcn skill**:
- **Popover composition**: `PopoverTrigger asChild` pattern allows custom trigger styling
- **Badge customization**: Custom OKLCH colors via className (skill: "Add custom variant")
- **Separator usage**: Creates visual hierarchy in dense information (skill pattern)
- **Button sizing**: `size="sm"` variant from shadcn button component
- **Conditional rendering**: Only show metadata if it exists
- **Text truncation**: `line-clamp-3` for preview (prevents overflow)

**Validation**:
- Popover opens/closes correctly with controlled state
- Badge colors match stage: gray (0), blue (1), purple (2)
- Icons display: 📄 (raw), 📊 (insight)
- Button triggers `onViewFull` callback
- Layout responsive at `w-96` width

---

### Step 4: Create LineageTree Component (Recursive Tree Visualization)

**What to implement**: Recursive vertical tree showing multi-hop citations with connection lines, stage badges, and type icons

**How to implement**: Based on shadcn skill's Card composition and custom recursive rendering

**Why this approach**:
- Card component provides clean container for each tree node (skill: "Card with header, content, footer")
- Recursive rendering handles variable-depth lineage (Stage 2 → 1 → 0)
- Visual connection lines use Tailwind border utilities
- Badge component provides consistent stage indicators

**Files to create**: `components/lineage-tree.tsx`

**Component structure** (following shadcn Card + custom layout patterns):
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

  const stageBadgeColor = {
    0: "bg-gray-500 text-white",
    1: "bg-blue-500 text-white",
    2: "bg-purple-500 text-white",
  }[chunk.stage] || "bg-gray-500 text-white";

  const typeIcon = chunk.type === "raw" ? "📄" : "📊";
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
        <div className="absolute left-4 top-6 bottom-0 w-0.5 bg-gray-300 dark:border-gray-600" />
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

**Key patterns from shadcn skill**:
- **Card composition**: Uses Card as container without CardHeader/CardContent (custom layout)
- **Badge reuse**: Same color scheme as CitationPopover for consistency
- **Responsive layout**: `flex-wrap` handles metadata overflow gracefully
- **Hover effects**: `hover:shadow-md transition-shadow` for interactivity (skill pattern)
- **Dark mode**: Border colors use `dark:border-gray-600` for OKLCH support
- **Recursive rendering**: Depth-first tree traversal with proper indentation

**Visual hierarchy techniques**:
- Icons (text-xl) draw attention to node type
- Stage badges provide color-coded depth
- Connection lines show parent-child relationships
- Indentation (`ml-8` per level) creates tree structure
- Monospace font for chunk_id emphasizes technical metadata

**Validation**:
- Tree renders recursively for multi-hop chains (Stage 2 → 1 → 0)
- Connection lines align correctly with card positions
- Empty nodes array returns null (no errors)
- Stage badges match color scheme across components
- Dark mode connection lines visible

---

### Step 5: Create LineageSheet Component (Side Panel Container)

**What to implement**: Side sheet that fetches full lineage and displays tree when citation is clicked

**How to implement**: Based on shadcn skill's Sheet (Drawer) component pattern with async data fetching

**Why this approach**:
- Sheet component provides slide-in panel from side (skill: "Sheet from side")
- Controlled open/close state managed by parent page
- Async data fetching in useEffect when sheet opens
- Loading states provide feedback during fetch (skill: "Loading states")

**Files to create**: `components/lineage-sheet.tsx`

**Component structure** (following shadcn Sheet + async patterns):
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

        // Fetch full lineage tree
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

**Key patterns from shadcn skill**:
- **Sheet structure**: SheetHeader + SheetContent pattern (skill: "Sheet from side")
- **Responsive width**: `sm:max-w-2xl` adapts to screen size
- **Overflow handling**: `overflow-y-auto` for long lineage trees
- **Loading states**: Three states: loading, empty, success (skill pattern)
- **Code formatting**: Inline `<code>` with muted background for chunk IDs
- **Error handling**: Try/catch with console.error (graceful degradation)

**Async data fetching pattern**:
- useEffect triggers when `open` or `chunkId` changes
- Guard clause prevents fetch if no chunkId
- Loading state prevents flash of empty content
- Empty lineage shows helpful message (raw data has no citations)

**Validation**:
- Sheet opens/closes with controlled state
- Fetches data only when opened
- Loading state displays during fetch
- Empty lineage shows informative message
- Tree renders correctly for multi-hop chains

---

### Step 6: Create InsightReport Component (Markdown with Interactive Citations)

**What to implement**: Markdown renderer that parses citation markers and replaces them with interactive CitationLink components

**How to implement**: Based on react-markdown with custom renderers and citation parsing utilities

**Why this approach**:
- ReactMarkdown provides controlled rendering with custom components
- Citation parsing extracts markers from References section
- Custom text renderer wraps citations with CitationLink
- Server action fetches chunk data for each citation

**Files to create**: `components/insight-report.tsx`

**Component structure** (react-markdown + shadcn composition):
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

  // Parse citation map from markdown References section
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
          // Custom renderer for paragraphs to replace citation markers
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

**Key patterns**:
- **Tailwind prose**: `prose dark:prose-invert` provides markdown styling (Tailwind Typography)
- **Custom renderers**: ReactMarkdown `components` prop allows custom paragraph rendering
- **Text processing**: String manipulation to split and inject React components
- **Async data fetching**: Two-stage: parse citations, then fetch chunks
- **Component composition**: Wraps processed text with CitationLink components

**Citation processing flow**:
1. Parse markdown to extract citation map ([1] → chunk_id)
2. Fetch chunk data for all citations (parallel server actions)
3. Render markdown with custom paragraph renderer
4. Replace citation markers with CitationLink components

**Validation**:
- Citation markers ([1], [2]) render as blue interactive links
- Hover triggers popover preview
- Click opens lineage sheet
- References section hidden from display
- Prose styling applies to markdown content

---

### Step 7: Wire Components in Main Page

**What to implement**: Integrate all components in `app/page.tsx` with state management for sheet open/close

**How to implement**: Based on Next.js client component patterns with controlled state

**Why this approach**:
- Client component handles interactive state (sheet open/close)
- Server action loads demo report markdown
- Controlled sheet state allows click-to-open functionality
- Container layout uses Tailwind utilities

**Files to modify**: `app/page.tsx`

**Page structure** (Next.js 16 + shadcn composition):
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

**Key patterns from shadcn skill**:
- **Container layout**: `container mx-auto` centers content with responsive padding
- **Card composition**: Report wrapped in card with border and padding
- **Color variables**: `bg-background`, `bg-card`, `text-muted-foreground` use OKLCH
- **Loading states**: Conditional rendering during async fetch
- **State lifting**: Citation click bubbles up to page, triggers sheet open

**Validation**:
- Page loads without errors at http://localhost:3000
- Demo report displays with interactive citations
- Hover citation shows popover preview
- Click "View Full" opens sheet with lineage tree
- Sheet closes on overlay click or X button

---

## Potential Pitfalls

### Pitfall 1: Popover Closes Immediately on Hover

**Issue**: Mouse movement from citation to popover closes the popover

**Solution from shadcn skill**:
- Keep `onMouseEnter`/`onMouseLeave` on citation trigger only
- Popover content stays open when mouse enters popover area (Radix UI handles this)
- Don't add conflicting mouse handlers on PopoverContent

### Pitfall 2: Citation Parsing Breaks with Nested Markdown

**Issue**: ReactMarkdown may wrap citations in nested spans/links

**Solution**:
- Process text at paragraph level (before nested rendering)
- Only replace citation markers in plain text nodes (check `typeof child === "string"`)
- Test with complex markdown (bold citations, citations in lists)

### Pitfall 3: Dark Mode Badge Colors Not Visible

**Issue**: Custom badge colors may not have proper contrast in dark mode

**Solution from shadcn skill**:
- Use explicit `text-white` for custom background colors
- Test badge readability in both themes
- OKLCH `bg-blue-500` automatically adjusts lightness, but text color needs manual specification

### Pitfall 4: Sheet Overflow Cuts Off Tree

**Issue**: Long lineage trees may extend beyond sheet height

**Solution from shadcn skill**:
- Add `overflow-y-auto` to SheetContent
- Use `max-h-screen` if needed for viewport constraint
- Test with deep lineage (3+ hops) to verify scrolling

### Pitfall 5: React Hydration Mismatch with Server Data

**Issue**: Citation chunks fetched client-side may cause layout shift

**Solution**:
- Use loading states during fetch (`{loading ? ... : ...}`)
- Render placeholder during fetch (prevents layout shift)
- "use client" directive ensures client-only rendering

---

## Testing Checklist

### Component Installation Tests
- [ ] All 6 shadcn components added successfully
- [ ] `components/ui/` directory contains all component files
- [ ] `bun run tsc --noEmit` passes without errors
- [ ] Component imports work in test file

### Citation Interaction Tests
- [ ] Hover citation marker shows popover preview
- [ ] Popover displays correct chunk text and metadata
- [ ] Stage badge shows correct color (gray/blue/purple)
- [ ] Type icon displays (📄 raw, 📊 insight)
- [ ] "View Full" button triggers sheet open
- [ ] Popover closes when mouse leaves

### Lineage Tree Tests
- [ ] Tree renders recursively for multi-hop chains (Stage 2 → 1 → 0)
- [ ] Connection lines align correctly with cards
- [ ] Indentation increases per depth level (ml-8 per level)
- [ ] Stage badges consistent across tree nodes
- [ ] Empty lineage shows "No citations" message

### Sheet Functionality Tests
- [ ] Sheet opens when citation clicked
- [ ] Sheet closes on overlay click
- [ ] Sheet closes on X button click
- [ ] Loading state displays during fetch
- [ ] Tree renders correctly inside sheet
- [ ] Sheet scrolls for long lineage

### Dark Mode Tests
- [ ] All components visible in dark mode
- [ ] Badge colors have proper contrast
- [ ] Connection lines visible (dark:border-gray-600)
- [ ] Citation links readable (dark:text-blue-400)
- [ ] Popover content readable

### Responsive Tests
- [ ] Page layout adapts to mobile viewport
- [ ] Sheet adapts to narrow screens (w-full sm:max-w-2xl)
- [ ] Popover doesn't overflow viewport (align="start")
- [ ] Tree indentation works on mobile (may need adjustment)

### Edge Case Tests
- [ ] Citation with null chunk data doesn't crash
- [ ] Markdown without citations renders normally
- [ ] Empty lineage (raw data chunk) shows message
- [ ] Multiple citations in one paragraph work
- [ ] Citation at end of paragraph (no trailing space) works

---

## Additional Resources

**shadcn/ui component documentation**:
- Popover: https://ui.shadcn.com/docs/components/popover
- Sheet: https://ui.shadcn.com/docs/components/sheet
- Card: https://ui.shadcn.com/docs/components/card
- Badge: https://ui.shadcn.com/docs/components/badge

**Skill reference files**:
- `/Users/gang/.claude/skills/shadcn/SKILL.md` - Main skill document with patterns
- `/Users/gang/.claude/skills/shadcn/resources/component-catalog.md` - Component reference
- `/Users/gang/.claude/skills/shadcn/resources/theming.md` - OKLCH color system

**Project reference files**:
- `/Users/gang/alixp-work/trace-demo/.claude/plan/citation-lineage-demo.md` - Overall implementation plan
- `/Users/gang/alixp-work/trace-demo/lib/types.ts` - TypeScript interfaces
- `/Users/gang/alixp-work/trace-demo/actions/lineage.ts` - Server actions

---

## Summary

This plan implements a citation lineage demo using shadcn/ui components with the following architecture:

**Component hierarchy**:
```
app/page.tsx (state management)
  ├─ InsightReport (markdown rendering)
  │   └─ CitationLink (interactive marker)
  │       └─ CitationPopover (preview overlay)
  │           ├─ Badge (stage indicator)
  │           ├─ Separator (divider)
  │           └─ Button ("View Full")
  └─ LineageSheet (side panel)
      └─ LineageTree (recursive tree)
          └─ Card (tree nodes)
              └─ Badge (stage indicator)
```

**Key shadcn patterns used**:
1. **Component composition**: Nested components for complex UIs
2. **Controlled state**: Parent manages open/close state
3. **OKLCH colors**: CSS variables for consistent theming
4. **Radix UI primitives**: Accessible overlays and interactions
5. **Tailwind utilities**: Responsive layout and spacing
6. **Custom variants**: Badge colors for stage indicators

**Implementation sequence**:
1. Install shadcn components (Step 1)
2. Build citation interaction (Steps 2-3)
3. Build tree visualization (Steps 4-5)
4. Create markdown renderer (Step 6)
5. Wire components in page (Step 7)

All components follow shadcn best practices: type-safe, accessible, customizable, and responsive.
