<!--
Document Type: Design Proposal (Refined)
Purpose: Chunk-level citation traceability with recursive inline citations for multi-stage insight generation
Context: Refinement after initial discussion - focuses on chunk-to-chunk citations and recursive traceability chains
Key Topics: Chunk-level citations, recursive inline citations, provenance tracking, hop depth decisions, concrete examples
Target Use: Design reference for prototype with explicit chunk-based citation model
-->

# Insight Traceability System Design v2
## Chunk-Level Recursive Citations

## Core Data Model

There are **two types of information** in the system:

### 1. Raw Data (Stage 0)
- Original source documents (PDFs, surveys, reports, web pages)
- Can be chunked for better retrieval
- Immutable (never edited, only re-ingested if updated)
- **No citations** (these are the leaf nodes)

### 2. Insights (Stage 1+)
- Human or AI-generated analysis/synthesis
- **Always chunked** (paragraph or statement-level granularity)
- Each chunk has **inline citations**
- **Immutable once published to shared knowledge base**
- **Citations point to**: Other insight chunks OR raw data chunks

### The Recursive Citation Model

```
Insight Chunk → Cites → Insight Chunk → Cites → Raw Data Chunk
                     ↘ Cites → Raw Data Chunk

Every insight chunk can cite:
- Other insight chunks (which themselves have citations)
- Raw data chunks (terminal nodes)
```

---

## Immutability Principle: The Academic Publishing Model

### Why Insights Must Be Immutable

Once an insight is published to the shared knowledge base, **it cannot be edited**. This is a fundamental design decision driven by citation integrity requirements.

#### The Problem with Editable Citations

**Scenario**: If editing were allowed:
```
1. Maher creates ins_survey_q3_chunk_5: "Daily usage increased 240%"
2. Manil cites it in ins_trends_chunk_8
3. Tony cites ins_trends_chunk_8 in final report
4. Maher edits ins_survey_q3_chunk_5 to "Daily usage increased 340%"
5. Now ins_trends_chunk_8 references content that changed
6. Citation integrity is broken
7. Traceability becomes unreliable
```

This defeats the entire purpose of solving the client's "citation verification nightmare."

#### Academic Publishing Precedent

Our system follows the same principles as academic/scientific publishing:

**Academic Papers**:
- Once published → **immutable**
- Errors discovered? → Publish **errata/corrigendum** (separate document)
- New findings? → **New paper**, not editing the old one
- Why? → **Citation integrity** - when Paper B cites Paper A, that reference must remain stable

**Our System**:
- Once in knowledge base → **immutable**
- Need correction? → Create **new insight**, mark old as superseded
- New analysis? → **New insight document**
- Why? → **Citation integrity** - when Insight B cites Insight A, that reference must remain stable

#### Benefits of Immutability

1. **Citation Integrity**: References always point to exact content that was cited
2. **Simpler Implementation**: No version tracking, no cascade updates, no "which version?" confusion
3. **Clear Audit Trail**: Linear provenance (created by X on Y), no edit history complexity
4. **Trust**: Users can rely on citations remaining accurate over time
5. **Conflict Prevention**: No synchronization issues when multiple people use same insight

#### How to Handle Corrections

**If an insight contains an error after publication:**

**Option 1: Supersession** (Recommended)
```
1. Create new insight with corrected content: ins_survey_q3_chunk_5_v2
2. Mark original as "superseded by ins_survey_q3_chunk_5_v2"
3. System warns users citing the old version:
   "⚠️ This insight has been superseded. Consider using v2."
4. Original remains in knowledge base (for historical citations)
5. New insights should cite the corrected version
```

**Option 2: Deprecation with Notes**
```
1. Mark insight as "deprecated - see correction notes"
2. Add metadata note explaining the error
3. Create new corrected insight
4. Existing citations remain valid but show warning
```

#### Workflow Impact

**User creates insight** → Can refine freely (local draft)
    ↓
**User publishes to knowledge base** → Status: "Published" (immutable)
    ↓
**Other users can cite it** → Citations are stable
    ↓
**Error discovered?** → Create new version, mark old as superseded
    ↓
**System notifies** → Users citing old version see supersession notice

This ensures flexibility during creation while maintaining citation integrity after publication.

---

## Concrete Example: 3-Level Citation Chain

Let me show how this works with actual text snippets at the chunk level.

### Raw Data (Stage 0)

**Document**: `stackoverflow_survey_2024.pdf`
**Chunk ID**: `raw_so_2024_chunk_42`
**Text**:
> "Question 47: How often do you use AI-powered coding assistants?
> Responses: Daily (34%), Weekly (28%), Monthly (15%), Never (23%).
> Compared to 2023: Daily usage increased from 10% to 34%."

---

**Document**: `gartner_ai_devtools_2024.pdf`
**Chunk ID**: `raw_gartner_2024_chunk_18`
**Text**:
> "Section 2.3: Market Analysis
> Enterprise adoption of AI development tools grew 280% YoY in Q3 2024,
> driven primarily by code completion features and automated debugging capabilities."

---

**Document**: `reddit_programming_jan_oct_2024.json`
**Chunk ID**: `raw_reddit_2024_chunk_91`
**Text**:
> "Thread: 'GitHub Copilot vs Cursor' (Aug 2024, 2.3k upvotes)
> Top comment: 'Switched to Cursor in March. My debugging time dropped by ~40%.
> The multi-file context is a game changer.'"

---

### Stage 1 Insights (First-Order Analysis)

**Insight Report**: `survey_analysis_q3_2024.md`
**Chunk ID**: `ins_survey_q3_chunk_5`
**Created by**: maher@alixpartners.com
**Created**: 2024-11-01 10:23 UTC
**Status**: Published (immutable)

**Text with inline citations**:
> "Developer adoption of AI coding tools experienced dramatic growth in 2024, with daily usage increasing from 10% to 34% year-over-year.[¹] This represents a 240% increase in daily active users."

**Citations**:
- [¹] `raw_so_2024_chunk_42` (Stack Overflow Survey 2024, Q47)

---

**Insight Report**: `developer_sentiment_2024.md`
**Chunk ID**: `ins_sentiment_chunk_12`
**Created by**: maher@alixpartners.com
**Created**: 2024-11-03 09:45 UTC

**Text with inline citations**:
> "Developers report significant productivity gains, with debugging time reductions of approximately 40% when using advanced AI coding assistants.[²] The most valued features are multi-file context awareness and intelligent code completion."

**Citations**:
- [²] `raw_reddit_2024_chunk_91` (Reddit r/programming, top-rated comment, Aug 2024)

---

### Stage 2 Insights (Second-Order Synthesis)

**Insight Report**: `ai_adoption_trends_2024.md`
**Chunk ID**: `ins_trends_chunk_8`
**Created by**: manil@alixpartners.com
**Created**: 2024-11-05 11:30 UTC
**Status**: Published (immutable)

**Text with inline citations**:
> "The AI development tools market saw explosive growth in 2024, with daily developer usage increasing 240% year-over-year.[³] Enterprise adoption grew even faster at 280% YoY,[⁴] indicating strong organizational buy-in beyond individual developer preferences. Productivity improvements of ~40% in debugging workflows[⁵] are driving this rapid adoption."

**Citations**:
- [³] `ins_survey_q3_chunk_5` (Insight: Survey Analysis Q3 2024)
  - **↳ This chunk itself cites**: `raw_so_2024_chunk_42`
- [⁴] `raw_gartner_2024_chunk_18` (Gartner Report, Section 2.3)
- [⁵] `ins_sentiment_chunk_12` (Insight: Developer Sentiment 2024)
  - **↳ This chunk itself cites**: `raw_reddit_2024_chunk_91`

---

### Stage 3 Insights (High-Level Synthesis)

**Insight Report**: `market_landscape_2024.md`
**Chunk ID**: `ins_landscape_chunk_3`
**Created by**: maher@alixpartners.com
**Created**: 2024-11-08 14:45 UTC

**Text with inline citations**:
> "AI coding assistants have crossed the chasm from early adopters to mainstream development practice.[⁶] The convergence of dramatic adoption growth and measurable productivity gains[⁷] suggests this technology shift is permanent rather than experimental."

**Citations**:
- [⁶] `ins_trends_chunk_8` (Insight: AI Adoption Trends 2024)
  - **↳ This chunk cites**: `ins_survey_q3_chunk_5` → `raw_so_2024_chunk_42`
  - **↳ This chunk cites**: `raw_gartner_2024_chunk_18`
- [⁷] `ins_sentiment_chunk_12` (Insight: Developer Sentiment 2024)
  - **↳ This chunk cites**: `raw_reddit_2024_chunk_91`

---

### Final Report (Client Deliverable)

**Report**: `ai_developer_tools_market_report_nov_2024.md`
**Section**: Executive Summary
**Created by**: manil@alixpartners.com
**Created**: 2024-11-09 10:00 UTC
**Status**: Final (export ready)

**Text with inline citations**:
> "The AI-powered development tools market has reached mainstream adoption in 2024.[⁸] Organizations should prioritize AI coding assistant deployment as a competitive necessity, not an experimental investment."

**Citations**:
- [⁸] `ins_landscape_chunk_3` (Insight: Market Landscape 2024)
  - **↳ This chunk cites**: `ins_trends_chunk_8` → multiple sources
  - **↳ This chunk cites**: `ins_sentiment_chunk_12` → `raw_reddit_2024_chunk_91`

---

## Visualization of Citation Chains

### Example 1: Simple 2-Hop Chain

```
Final Report Statement:
"Organizations should prioritize AI coding assistant deployment"

[Citation ⁸]
    ↓
Insight (Stage 3): ins_landscape_chunk_3
"AI coding assistants have crossed the chasm"
Created: 2024-11-08 by maher@alixpartners.com
    ↓ [Citation ⁷]
    ↓
Insight (Stage 1): ins_sentiment_chunk_12
"Debugging time reductions of ~40%"
Created: 2024-11-03 by maher@alixpartners.com
    ↓ [Citation ²]
    ↓
Raw Data: raw_reddit_2024_chunk_91
"My debugging time dropped by ~40%"
Source: Reddit r/programming, Aug 2024
```

### Example 2: Complex Multi-Path Chain

```
Insight (Stage 2): ins_trends_chunk_8
"Explosive growth in 2024, with daily usage up 240%[³] and enterprise adoption up 280%[⁴]"
Created: 2024-11-05 by manil@alixpartners.com

├─ [Citation ³] ins_survey_q3_chunk_5 (Stage 1)
│  "Daily usage increased from 10% to 34% year-over-year"
│  Created: 2024-11-01 by maher@alixpartners.com
│  └─ [Citation ¹] raw_so_2024_chunk_42
│     "Daily usage increased from 10% to 34%"
│     Source: Stack Overflow Survey 2024, Q47
│
├─ [Citation ⁴] raw_gartner_2024_chunk_18 (Stage 0)
│  "Enterprise adoption grew 280% YoY in Q3 2024"
│  Source: Gartner Report, Section 2.3
│
└─ [Citation ⁵] ins_sentiment_chunk_12 (Stage 1)
   "Debugging time reductions of ~40%"
   Created: 2024-11-03 by maher@alixpartners.com
   └─ [Citation ²] raw_reddit_2024_chunk_91
      "My debugging time dropped by ~40%"
      Source: Reddit r/programming, Aug 2024
```

---

## The "Hop Depth" Decision

### Critical Design Question

**When a user sees a citation, how many levels deep should we show automatically?**

#### Option A: Show Only Immediate Source (1-Hop)

**What the user sees by default**:
```
"Organizations should prioritize AI deployment.[⁸]"

[⁸] Insight: Market Landscape 2024 (ins_landscape_chunk_3)
    Created: 2024-11-08 by maher@alixpartners.com
    Type: Stage 3 Synthesis
    [Click to view sources →]
```

**Pros**:
- Clean, uncluttered
- Fast to render
- User knows immediate source

**Cons**:
- Doesn't show full provenance
- Requires multiple clicks to reach raw data
- Can't quickly assess confidence

---

#### Option B: Show Full Chain to Raw Data (N-Hop)

**What the user sees by default**:
```
"Organizations should prioritize AI deployment.[⁸]"

[⁸] Full Citation Chain (3 hops to raw data):

    Insight (Stage 3): Market Landscape 2024
    ├─ Insight (Stage 2): AI Adoption Trends 2024
    │  ├─ Insight (Stage 1): Survey Analysis Q3 2024
    │  │  └─ 📄 Raw: Stack Overflow Survey 2024, Q47
    │  ├─ 📄 Raw: Gartner Report, Section 2.3
    │  └─ Insight (Stage 1): Developer Sentiment 2024
    │     └─ 📄 Raw: Reddit r/programming, Aug 2024
```

**Pros**:
- Complete transparency
- Can assess confidence immediately
- See all sources at once

**Cons**:
- Can be overwhelming
- Takes up space
- Slow to render for deep chains

---

#### Option C: Progressive Disclosure (Recommended)

**Default view** (1-hop):
```
"Organizations should prioritize AI deployment.[⁸]"

[⁸] Insight: Market Landscape 2024 (Stage 3 Synthesis)
    Created: 2024-11-08 by maher@alixpartners.com
    Cites: 2 sources (1 insight, 1 raw data)
    Max depth to raw data: 3 hops

    [+ Expand full lineage]
```

**Expanded view** (click to show):
```
[⁸] Full Citation Lineage:

    📊 Insight (Stage 3): ins_landscape_chunk_3
    "AI coding assistants have crossed the chasm"
    └─ Created: 2024-11-08 by maher@alixpartners.com

        ├─ 📊 [⁶] ins_trends_chunk_8 (Stage 2)
        │  "Explosive growth in 2024..."
        │  └─ Created: 2024-11-05 by manil@alixpartners.com
        │
        │      ├─ 📊 [³] ins_survey_q3_chunk_5 (Stage 1)
        │      │  "Daily usage increased 240%"
        │      │  └─ Created: 2024-11-01 by maher@alixpartners.com
        │      │
        │      │      └─ 📄 [¹] raw_so_2024_chunk_42
        │      │         "Daily usage: 10% → 34%"
        │      │         Source: Stack Overflow Survey 2024, Q47
        │      │
        │      ├─ 📄 [⁴] raw_gartner_2024_chunk_18
        │      │  "Enterprise adoption grew 280%"
        │      │  Source: Gartner Report 2024, Section 2.3
        │      │
        │      └─ 📊 [⁵] ins_sentiment_chunk_12 (Stage 1)
        │         "Debugging time reductions ~40%"
        │         └─ Created: 2024-11-03 by maher@alixpartners.com
        │
        │             └─ 📄 [²] raw_reddit_2024_chunk_91
        │                "Debugging time dropped ~40%"
        │                Source: Reddit r/programming, Aug 2024
        │
        └─ 📊 [⁷] ins_sentiment_chunk_12 (Stage 1)
           [Same as above - already shown]
```

---

## Metadata Structure for Chunks

### Insight Chunk Object

```json
{
  "chunk_id": "ins_trends_chunk_8",
  "parent_document_id": "ai_adoption_trends_2024",
  "chunk_index": 8,
  "stage": 2,

  "content": {
    "text": "The AI development tools market saw explosive growth...",
    "word_count": 47,
    "language": "en"
  },

  "citations": [
    {
      "citation_number": 3,
      "citation_marker": "[³]",
      "target_chunk_id": "ins_survey_q3_chunk_5",
      "target_type": "insight",
      "target_stage": 1,
      "target_text_preview": "Developer adoption of AI coding tools...",
      "relationship": "derived_from",
      "confidence_contribution": 0.35
    },
    {
      "citation_number": 4,
      "citation_marker": "[⁴]",
      "target_chunk_id": "raw_gartner_2024_chunk_18",
      "target_type": "raw_data",
      "target_stage": 0,
      "target_text_preview": "Enterprise adoption grew 280%...",
      "exact_reference": "Section 2.3, Page 12",
      "relationship": "supports",
      "confidence_contribution": 0.40
    },
    {
      "citation_number": 5,
      "citation_marker": "[⁵]",
      "target_chunk_id": "ins_sentiment_chunk_12",
      "target_type": "insight",
      "target_stage": 1,
      "target_text_preview": "Developers report significant productivity...",
      "relationship": "supports",
      "confidence_contribution": 0.25
    }
  ],

  "provenance": {
    "created_by": "manil@alixpartners.com",
    "created_at": "2024-11-05T11:30:00Z",
    "status": "published",
    "creation_method": "human_written",
    "tools_used": ["semantic_search", "keyword_search"]
  },

  "supersession": {
    "is_superseded": false,
    "superseded_by": null,
    "supersedes": null,
    "deprecation_note": null
  },

  "lineage_metrics": {
    "direct_citations_count": 3,
    "max_hops_to_raw_data": 2,
    "total_raw_sources_in_lineage": 3,
    "total_insight_sources_in_lineage": 2,
    "confidence_score": 0.82
  }
}
```

### Raw Data Chunk Object

```json
{
  "chunk_id": "raw_so_2024_chunk_42",
  "parent_document_id": "stackoverflow_survey_2024",
  "chunk_index": 42,
  "stage": 0,

  "content": {
    "text": "Question 47: How often do you use AI-powered coding assistants?...",
    "word_count": 38,
    "language": "en"
  },

  "citations": [],

  "source_metadata": {
    "source_type": "survey",
    "source_title": "Stack Overflow Developer Survey 2024",
    "source_url": "https://stackoverflow.com/survey/2024",
    "publication_date": "2024-09-15",
    "author": "Stack Overflow",
    "exact_reference": "Question 47, Page 23",
    "ingested_at": "2024-10-01T09:00:00Z",
    "ingested_by": "maher@alixpartners.com"
  },

  "usage_tracking": {
    "cited_by_count": 5,
    "cited_by_insight_chunks": [
      "ins_survey_q3_chunk_5",
      "ins_developer_tools_chunk_3",
      "..."
    ],
    "first_used_at": "2024-11-01T10:23:00Z",
    "last_used_at": "2024-11-08T14:45:00Z"
  }
}
```

---

## Supersession & Correction Handling

### Why Supersession Instead of Editing

Since insights are immutable once published, we need a mechanism to handle corrections, updates, or improvements. **Supersession** allows creating new versions while preserving citation integrity.

### Supersession Workflow

**Scenario**: Error discovered in published insight

```
1. Original insight published:
   ins_survey_q3_chunk_5: "Daily usage increased 240%"
   Status: Published
   Created: 2024-11-01 by maher@alixpartners.com

2. Error discovered - should be 340%, not 240%

3. Create new version:
   ins_survey_q3_chunk_5_v2: "Daily usage increased 340%"
   Status: Published
   Created: 2024-11-08 by maher@alixpartners.com
   Supersedes: ins_survey_q3_chunk_5

4. Mark original as superseded:
   ins_survey_q3_chunk_5:
   Status: Superseded
   Superseded_by: ins_survey_q3_chunk_5_v2
   Deprecation_note: "Corrected percentage calculation"

5. Existing citations remain valid:
   ins_trends_chunk_8 still cites ins_survey_q3_chunk_5
   BUT shows warning: "⚠️ Superseded - consider v2"

6. New insights should cite:
   ins_trends_chunk_8_v2 cites ins_survey_q3_chunk_5_v2
```

### Supersession Metadata Example

**Original (superseded) insight:**
```json
{
  "chunk_id": "ins_survey_q3_chunk_5",
  "content": {
    "text": "Daily usage increased 240%..."
  },
  "provenance": {
    "created_by": "maher@alixpartners.com",
    "created_at": "2024-11-01T10:23:00Z",
    "status": "superseded"
  },
  "supersession": {
    "is_superseded": true,
    "superseded_by": "ins_survey_q3_chunk_5_v2",
    "supersedes": null,
    "superseded_at": "2024-11-08T09:15:00Z",
    "superseded_reason": "Corrected percentage calculation - was 240%, should be 340%"
  }
}
```

**New (corrected) insight:**
```json
{
  "chunk_id": "ins_survey_q3_chunk_5_v2",
  "content": {
    "text": "Daily usage increased 340%..."
  },
  "provenance": {
    "created_by": "maher@alixpartners.com",
    "created_at": "2024-11-08T09:15:00Z",
    "status": "published"
  },
  "supersession": {
    "is_superseded": false,
    "superseded_by": null,
    "supersedes": "ins_survey_q3_chunk_5",
    "deprecation_note": null
  }
}
```

### UI Handling for Superseded Insights

**When user views citation to superseded insight:**

```
┌────────────────────────────────────────────────┐
│ ⚠️ SUPERSEDED CITATION [³]                     │
├────────────────────────────────────────────────┤
│ Type: Insight (Stage 1)                       │
│ Source: Survey Analysis Q3 2024               │
│ Chunk: ins_survey_q3_chunk_5                  │
│                                               │
│ ⚠️ This insight has been superseded           │
│                                               │
│ Reason: Corrected percentage calculation      │
│ Superseded: Nov 8, 2024                       │
│                                               │
│ New version available:                        │
│ ins_survey_q3_chunk_5_v2                      │
│ "Daily usage increased 340%..."               │
│                                               │
│ [View superseded version]                     │
│ [View new version →]                          │
│ [Update citation to v2]                       │
└────────────────────────────────────────────────┘
```

**When user tries to cite superseded insight:**

```
┌────────────────────────────────────────────────┐
│ ⚠️ WARNING: Citing Superseded Insight          │
├────────────────────────────────────────────────┤
│ You are about to cite:                        │
│ ins_survey_q3_chunk_5 (SUPERSEDED)            │
│                                               │
│ This insight has been replaced by:            │
│ ins_survey_q3_chunk_5_v2                      │
│                                               │
│ Recommendation: Use the newer version         │
│                                               │
│ [Cite new version (recommended)]              │
│ [Cite old version anyway]                     │
│ [Cancel]                                      │
└────────────────────────────────────────────────┘
```

---

## UI/UX Prototypes

### Prototype 1: Inline Citation Tooltip (Hover)

**User Action**: Hover over `[³]` in the text

**Tooltip appears**:
```
┌────────────────────────────────────────────────┐
│ 📊 CITATION [³]                                │
├────────────────────────────────────────────────┤
│ Type: Insight (Stage 1)                       │
│ Source: Survey Analysis Q3 2024               │
│ Chunk: ins_survey_q3_chunk_5                  │
│                                               │
│ Preview:                                      │
│ "Developer adoption of AI coding tools        │
│ experienced dramatic growth in 2024..."       │
│                                               │
│ This insight also cites:                      │
│ • [¹] Stack Overflow Survey 2024, Q47         │
│                                               │
│ Created: 2024-11-01 by maher@...              │
│ Confidence: 88%                               │
│                                               │
│ [View full lineage →] [Open source →]        │
└────────────────────────────────────────────────┘
```

### Prototype 2: Citation Panel (Click)

**User Action**: Click on `[³]` in the text

**Side panel slides in**:
```
╔═══════════════════════════════════════════╗
║ CITATION DETAILS [³]                      ║
╠═══════════════════════════════════════════╣
║                                           ║
║ 📊 Insight (Stage 1)                      ║
║ Survey Analysis Q3 2024                   ║
║ Chunk ID: ins_survey_q3_chunk_5           ║
║                                           ║
║ ─────────────────────────────────────────║
║ Full Text:                                ║
║ ─────────────────────────────────────────║
║                                           ║
║ "Developer adoption of AI coding tools    ║
║ experienced dramatic growth in 2024,      ║
║ with daily usage increasing from 10% to   ║
║ 34% year-over-year.[¹] This represents    ║
║ a 240% increase in daily active users."   ║
║                                           ║
║ ─────────────────────────────────────────║
║ This Chunk's Citations:                   ║
║ ─────────────────────────────────────────║
║                                           ║
║ [¹] 📄 Stack Overflow Survey 2024         ║
║     Question 47, Page 23                  ║
║     "Daily usage increased from 10%       ║
║     to 34%"                               ║
║                                           ║
║     [View raw data →]                     ║
║                                           ║
║ ─────────────────────────────────────────║
║ Provenance:                               ║
║ ─────────────────────────────────────────║
║                                           ║
║ Created: Nov 1, 2024 10:23 UTC            ║
║ By: maher@alixpartners.com                ║
║ Status: Published (immutable)             ║
║                                           ║
║ ─────────────────────────────────────────║
║ Lineage Summary:                          ║
║ ─────────────────────────────────────────║
║                                           ║
║ Total depth: 1 hop to raw data            ║
║ Raw sources: 1                            ║
║ Confidence: 88%                           ║
║                                           ║
║ ─────────────────────────────────────────║
║                                           ║
║ [← Back] [View full lineage tree]        ║
║                                           ║
╚═══════════════════════════════════════════╝
```

### Prototype 3: Full Lineage Tree View

**User Action**: Click "View full lineage" on citation `[⁸]`

**Modal/overlay appears**:
```
═══════════════════════════════════════════════════════════════
                    CITATION LINEAGE [⁸]
═══════════════════════════════════════════════════════════════

Current Insight: Market Landscape 2024 (Stage 3)
"AI coding assistants have crossed the chasm from early
adopters to mainstream development practice."

───────────────────────────────────────────────────────────────
                     FULL CITATION TREE
───────────────────────────────────────────────────────────────

📊 ins_landscape_chunk_3 (Stage 3)
│  Created: Nov 8, 2024 by maher@...
│  Confidence: 85%
│
├─┬─ [⁶] 📊 ins_trends_chunk_8 (Stage 2)
│ │  "Explosive growth in 2024..."
│ │  Created: Nov 5, 2024 by manil@...
│ │
│ ├─┬─ [³] 📊 ins_survey_q3_chunk_5 (Stage 1)
│ │ │  "Daily usage increased 240%"
│ │ │  Created: Nov 1, 2024 by maher@...
│ │ │
│ │ └─── [¹] 📄 raw_so_2024_chunk_42 (Raw Data)
│ │      "Daily usage: 10% → 34%"
│ │      Source: Stack Overflow Survey 2024, Q47
│ │      Published: Sep 15, 2024
│ │
│ ├───── [⁴] 📄 raw_gartner_2024_chunk_18 (Raw Data)
│ │      "Enterprise adoption grew 280%"
│ │      Source: Gartner Report 2024, Section 2.3
│ │      Published: Oct 5, 2024
│ │
│ └─┬─ [⁵] 📊 ins_sentiment_chunk_12 (Stage 1)
│   │  "Debugging time reductions ~40%"
│   │  Created: Nov 3, 2024 by maher@...
│   │
│   └─── [²] 📄 raw_reddit_2024_chunk_91 (Raw Data)
│        "Debugging time dropped ~40%"
│        Source: Reddit r/programming, Aug 2024
│        Published: Aug 12, 2024
│
└─┬─ [⁷] 📊 ins_sentiment_chunk_12 (Stage 1)
  │  [DUPLICATE - Same as [⁵] above]
  │
  └─── [²] 📄 raw_reddit_2024_chunk_91 (Raw Data)
       [DUPLICATE - Same as above]

───────────────────────────────────────────────────────────────
                      LINEAGE SUMMARY
───────────────────────────────────────────────────────────────

Total hops to raw data: 3
Total unique raw sources: 3
Total unique insight sources: 3
Total duplicates: 2
Overall confidence: 85%

Raw sources by date:
• Aug 12, 2024 - Reddit discussion
• Sep 15, 2024 - Stack Overflow Survey
• Oct 5, 2024 - Gartner Report

Contributors:
• maher@alixpartners.com (3 insights)
• manil@alixpartners.com (1 insight)

───────────────────────────────────────────────────────────────

[← Close] [Export tree] [Download sources]

═══════════════════════════════════════════════════════════════
```

---

## Key Design Decisions to Validate

### 1. Default Hop Depth

**Question**: "When you click a citation, do you want to see just the immediate source, or automatically expand to show all sources back to raw data?"

**Options**:
- A) Show only immediate (1-hop), let user expand if needed ← **Recommended**
- B) Always show full tree (N-hops)
- C) Show summary stats (e.g., "3 hops, 4 raw sources") + expand option

**Recommendation**: Option C - Show immediate source + lineage summary, with expand button

---

### 2. Duplicate Citation Handling

**Scenario**: `ins_landscape_chunk_3` cites `ins_sentiment_chunk_12` twice (as [⁶] via path 1, and [⁷] directly)

**Question**: "Should we show the duplicate citation chain twice, or collapse/merge duplicates?"

**Options**:
- A) Show duplicate branches in full (transparent but verbose)
- B) Show once, mark as "cited 2x" ← **Recommended**
- C) Show once, hide duplicate path entirely

---

### 3. Chunk Granularity

**Question**: "How should we chunk insight documents - by paragraph, by sentence, or custom boundaries?"

**Options**:
- A) Paragraph-level (flexible, natural reading)
- B) Sentence-level (precise citations, but fragmented)
- C) Custom markers (user inserts chunk boundaries manually)
- D) Semantic chunks (AI determines logical units) ← **Recommended**

**Recommendation**: Option D with Option C as override - Let AI chunk semantically, but allow manual refinement

---

### 4. Citation Number Namespace

**Question**: "Should citation numbers be global across entire report, or restart per document/section?"

**Example - Global numbering**:
```
Section 1: "Growth was 340%[¹]"
Section 2: "Developers report gains[²]"
Section 3: "Market reached maturity[³]"
```

**Example - Section-level numbering**:
```
Section 1: "Growth was 340%[¹]"
Section 2: "Developers report gains[¹]"  ← Same number, different source
Section 3: "Market reached maturity[¹]"
```

**Recommendation**: Global numbering for clarity, but show source context in tooltip

---

### 5. Supersession Notification

**Question**: "If an insight I've cited gets superseded, should I be notified?"

**Scenario**:
```
ins_survey_q3_chunk_5 (Stage 1)
"Daily usage increased 240%"
    ↑
    └─ Cited by: ins_trends_chunk_8 (Stage 2)
                 ins_landscape_chunk_3 (Stage 3)
                 market_report_nov_2024 (Final)

Then: ins_survey_q3_chunk_5 marked as superseded by ins_survey_q3_chunk_5_v2
```

Should the system:
- A) Do nothing - citations remain valid, show warning when viewed ← **Recommended for MVP**
- B) Notify authors of downstream insights via email/alert
- C) Flag downstream insights as "cites superseded source - review recommended"
- D) Automatically suggest creating new versions citing updated source

**Recommendation**: Option A for MVP, Option C for later enhancement

---

## Confidence Scoring Based on Lineage

### Factors That Affect Confidence

1. **Depth (hops to raw data)**:
   - 0 hops (direct quote from raw): 100% base confidence
   - 1 hop (first-order analysis): 90% base confidence
   - 2 hops (synthesis of analyses): 80% base confidence
   - 3+ hops: Diminishing (70%, 60%, ...)

2. **Source quality**:
   - Peer-reviewed research: +5%
   - Industry reports (Gartner, Forrester): +3%
   - Surveys (Stack Overflow, etc.): +2%
   - Social media (Reddit, Twitter): -5%
   - Unverified sources: -10%

3. **Recency**:
   - Within 3 months: +0%
   - 3-6 months old: -2%
   - 6-12 months old: -5%
   - 12+ months old: -10%

4. **Supersession status**:
   - Current version: +0%
   - Superseded (but still cited): -10%
   - Deprecated: -15%

5. **Consensus**:
   - Single source: -5%
   - 2-3 sources agreeing: +0%
   - 4+ sources agreeing: +5%
   - Contradictory sources: -15%

### Example Calculation

**Insight**: `ins_trends_chunk_8`
- Base confidence (2 hops): 80%
- Sources: Gartner (+3%), Stack Overflow (+2%), avg = +2.5%
- Recency: All within 2 months (+0%)
- Supersession: Current version (+0%)
- Consensus: 3 agreeing sources (+0%)

**Final confidence**: 80% + 2.5% + 0% + 0% = **82.5% → 83%**

---

## Implementation Roadmap

### Phase 1: Data Model & Storage (Week 1)

**Deliverables**:
- Database schema for chunk storage
- Citation graph structure
- Provenance metadata fields
- Supersession tracking

**Success criteria**:
- Can store insight chunks with inline citations
- Can traverse citation graph backward (chunk → sources)
- Can mark insights as superseded and track relationships
- Can calculate lineage metrics (depth, raw source count)

---

### Phase 2: Simple Prototype (Week 1-2)

**Deliverables**:
- Static HTML prototype with 3-stage example
- Tooltip on hover (1-hop view)
- Click to expand (full lineage tree)
- Sample data with realistic citations

**Success criteria**:
- Client can interact with prototype
- Demonstrates chunk-level citations clearly
- Shows recursive citation chains
- Validates UX approach

---

### Phase 3: Backend API (Week 2-3)

**Deliverables**:
- REST API for chunk retrieval
- Citation graph traversal endpoints
- Lineage calculation service
- Confidence scoring algorithm

**Endpoints**:
```
GET /chunks/{chunk_id}
GET /chunks/{chunk_id}/citations
GET /chunks/{chunk_id}/lineage
GET /chunks/{chunk_id}/supersession
POST /chunks (create new insight chunk)
POST /chunks/{chunk_id}/supersede (mark as superseded, create new version)
```

---

### Phase 4: UI Integration (Week 3-4)

**Deliverables**:
- React/Vue components for citations
- Interactive lineage tree visualization
- Supersession warning UI
- Confidence score badges

**Components**:
- `<CitationTooltip>`
- `<CitationPanel>`
- `<LineageTree>`
- `<SupersessionWarning>`
- `<ConfidenceBadge>`

---

### Phase 5: Human-in-the-Loop Creation (Week 4-5)

**Deliverables**:
- Insight editor with citation picker
- Real-time citation validation
- Preview of how citation will appear
- Warning for broken/circular citations

**Features**:
- As user writes insight, suggest citations from knowledge base
- Auto-detect when user references existing chunks
- Show lineage preview before saving
- Calculate confidence in real-time

---

### Phase 6: Report Generation (Week 5-6)

**Deliverables**:
- Export to Word with proper citations
- Export to PDF with interactive citations
- Citation style templates (APA, footnotes, etc.)
- Validation before export

**Features**:
- Choose citation format
- Include/exclude lineage details
- Generate bibliography automatically
- Confidence score report

---

## Open Questions for Client

### Question Set 1: User Experience

1. **Default view preference**: When you see a citation, do you want to immediately see the full chain to raw data, or prefer to expand on-demand?

2. **Chunk size comfort**: Would you prefer larger chunks (paragraph-level) for context, or smaller chunks (sentence-level) for precision?

3. **Supersession notifications**: If a source you've cited gets superseded by a new version, do you want to be notified? Should the system flag your insights for review?

### Question Set 2: Confidence & Trust

4. **Confidence thresholds**: What confidence score would make you uncomfortable using an insight in a client report? (e.g., below 70%?)

5. **Source weighting**: Should Reddit discussions count less than Gartner reports? How much less?

6. **Derivation depth limits**: Is there a maximum number of hops (e.g., 4 stages) before an insight becomes too removed from raw data?

### Question Set 3: Workflow

7. **Citation creation**: When writing insights, would you prefer to:
   - Manually select citations from a picker
   - Have AI suggest citations based on content
   - Mix of both

8. **Duplicate handling**: If the same raw source is cited via multiple paths, show it multiple times (transparent) or once (cleaner)?

9. **Version naming**: When creating a corrected version, should the system auto-generate names (ins_X_v2) or let users choose custom names?

### Question Set 4: Reporting

10. **Client-facing reports**: Should citations in final deliverables show:
    - Just the immediate source
    - Full lineage in appendix
    - Confidence scores visible or hidden

11. **Citation styles**: Do you have a preferred citation format (APA, Chicago, footnotes, endnotes)?

12. **Verification workflow**: Before finalizing a report, would you want a "citation validation" step that checks all sources are still accessible and unchanged?

---

## Success Metrics

### Efficiency Gains

**Before traceability system**:
- Time to verify all citations in 20-page report: ~4 hours
- Citation errors found post-delivery: 5-10 per report
- Time to trace single fact to source: 15-30 minutes

**After traceability system** (target):
- Time to verify all citations: <30 minutes
- Citation errors: <1 per report
- Time to trace single fact: <30 seconds

### Quality Metrics

- **Citation coverage**: 100% of insights have documented sources
- **Confidence scores**: Average >75% for final reports
- **Supersession tracking**: 100% of corrections properly versioned
- **Broken citations**: <1% (detect and alert before export)

### User Adoption

- **Daily active users**: All team members using for insight creation
- **Insights created per week**: Track growth
- **Supersession rate**: % of insights that get superseded (monitor for quality)
- **Citation usage**: % of insights with 2+ sources (target: >60%)

---

## Next Steps

1. **Review this document** with Tony
2. **Create static HTML prototype** with sample 3-stage scenario
3. **Schedule client feedback session** to validate:
   - UX approach (tooltips vs panels vs trees)
   - Default hop depth
   - Confidence scoring factors
   - Chunk granularity preferences
4. **Design database schema** based on metadata structure above
5. **Build backend API** for citation graph traversal
6. **Integrate with chat layer** for citation capture during insight creation

---

## Appendix: Alternative Visualization Styles

### Style A: Academic Citation Format

```markdown
The AI development tools market saw explosive growth in 2024,
with daily developer usage increasing 240% year-over-year
(Singh & Patel, 2024, derived from Stack Overflow, 2024).
Enterprise adoption grew even faster at 280% YoY (Gartner, 2024).
```

**Bibliography**:
```
Gartner. (2024). AI Development Tools Market Analysis 2024.
  Section 2.3, p. 12.

Singh, M. & Patel, N. (2024). Survey Analysis Q3 2024.
  Internal insight report. AlixPartners.
  Derived from: Stack Overflow Developer Survey 2024, Q47.

Stack Overflow. (2024). Developer Survey 2024. Question 47.
  Retrieved from https://stackoverflow.com/survey/2024
```

### Style B: Inline Parenthetical with Depth Indicator

```markdown
The AI development tools market saw explosive growth in 2024,
with daily usage up 240% (Stage 1→Raw) and enterprise adoption
up 280% (Raw).
```

### Style C: Colored Badges by Source Type

```markdown
The AI development tools market saw explosive growth in 2024,
with daily usage up 240% [📊¹] and enterprise adoption up 280% [📄²].

Legend:
📄 = Direct from raw data
📊 = Derived from analysis
🔬 = Multi-stage synthesis
```

---

## Appendix: Database Schema (PostgreSQL)

```sql
-- Chunks table (both raw data and insights)
CREATE TABLE chunks (
    chunk_id VARCHAR(50) PRIMARY KEY,
    parent_document_id VARCHAR(50) NOT NULL,
    chunk_index INTEGER NOT NULL,
    stage INTEGER NOT NULL,  -- 0 = raw, 1+ = insight stages
    chunk_type VARCHAR(20) NOT NULL,  -- 'raw_data' or 'insight'
    content TEXT NOT NULL,
    word_count INTEGER,
    language VARCHAR(5) DEFAULT 'en',

    -- Provenance (for insights; NULL for raw data)
    created_by VARCHAR(100),
    created_at TIMESTAMP,
    status VARCHAR(20),  -- 'draft', 'published', 'superseded', 'deprecated'
    creation_method VARCHAR(50),  -- 'human_written', 'ai_generated', 'hybrid'

    -- Supersession tracking (for insights only)
    is_superseded BOOLEAN DEFAULT false,
    superseded_by VARCHAR(50),  -- chunk_id of newer version
    supersedes VARCHAR(50),  -- chunk_id of older version
    superseded_at TIMESTAMP,
    superseded_reason TEXT,

    -- Source metadata (for raw data only)
    source_type VARCHAR(50),  -- 'survey', 'report', 'article', etc.
    source_title TEXT,
    source_url TEXT,
    publication_date DATE,
    author VARCHAR(200),
    exact_reference TEXT,
    ingested_at TIMESTAMP,
    ingested_by VARCHAR(100),

    -- Lineage metrics (for insights only)
    max_hops_to_raw_data INTEGER,
    total_raw_sources_in_lineage INTEGER,
    total_insight_sources_in_lineage INTEGER,
    confidence_score DECIMAL(5,4),

    created_timestamp TIMESTAMP DEFAULT NOW()
);

-- Citations table (the graph edges)
CREATE TABLE citations (
    citation_id SERIAL PRIMARY KEY,
    source_chunk_id VARCHAR(50) REFERENCES chunks(chunk_id),
    target_chunk_id VARCHAR(50) REFERENCES chunks(chunk_id),
    citation_number INTEGER,  -- [1], [2], etc.
    citation_marker VARCHAR(10),  -- '[¹]', '[²]', etc.
    relationship VARCHAR(50),  -- 'derived_from', 'supports', 'contradicts', 'supersedes'
    confidence_contribution DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(source_chunk_id, target_chunk_id)
);

-- Index for fast lineage traversal
CREATE INDEX idx_citations_source ON citations(source_chunk_id);
CREATE INDEX idx_citations_target ON citations(target_chunk_id);
CREATE INDEX idx_chunks_stage ON chunks(stage);
CREATE INDEX idx_chunks_status ON chunks(status);
CREATE INDEX idx_chunks_superseded ON chunks(is_superseded);
CREATE INDEX idx_chunks_created_at ON chunks(created_at);
```
