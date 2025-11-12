<!--
Document Type: Technical Walkthrough
Purpose: Explains how insight reports with inline citations are processed, chunked, and stored with proper citation lineage
Context: AlixPartners project - shows the complete data pipeline from raw insight text to vector DB + graph DB
Key Topics: Insight creation, citation resolution, chunking strategy, database storage, citation mapping
Target Use: Understanding the front-end processing that feeds into the dual-database architecture
-->

# Insights Processing Pipeline: From Report to Database

## The Core Challenge

**What we have**: A full insight report (written by human or LLM) with inline citations that include `chunk_id`:

```markdown
Developer adoption of AI coding tools experienced dramatic growth in 2024,
with daily usage increasing from 10% to 34% year-over-year.[¹] This represents
a 240% increase in daily active users.

Enterprise adoption grew even faster at 280% YoY.[²] The convergence of
individual and organizational adoption suggests this technology shift is
permanent rather than experimental.

[¹] raw_so_2024_chunk_42 - Stack Overflow Developer Survey 2024, Q47
[²] raw_gartner_2024_chunk_18 - Gartner Report 2024, Section 2.3
```

**Key detail**: Citations include the `chunk_id` directly (e.g., `raw_so_2024_chunk_42`), not just human-readable descriptions.

**What we need**: Individual chunks stored in vector DB with citation edges in graph DB:

```
Vector DB:
  - ins_survey_q3_chunk_5: "Developer adoption...240% increase..."
  - ins_survey_q3_chunk_6: "Enterprise adoption...280% YoY..."

Graph DB:
  - ins_survey_q3_chunk_5 → raw_so_2024_chunk_42
  - ins_survey_q3_chunk_6 → raw_gartner_2024_chunk_18
```

**The question**: How do we get from A to B?

---

## How Users Get Chunk IDs (UI Workflow)

Before diving into the processing pipeline, let's understand how users create citations with `chunk_id` in the first place.

### UI Citation Picker Workflow

When a user writes an insight and wants to cite a source:

**Step 1: User searches for source**
```
User types: "Stack Overflow survey AI tools"
→ Vector DB semantic search returns top results
```

**Step 2: UI shows results with chunk_id**
```
Search Results:
┌─────────────────────────────────────────────────────────┐
│ 1. raw_so_2024_chunk_42                                 │
│    "Question 47: How often do you use AI-powered..."    │
│    Source: Stack Overflow Developer Survey 2024         │
│    [Insert Citation]                                    │
├─────────────────────────────────────────────────────────┤
│ 2. raw_so_2024_chunk_18                                 │
│    "Question 18: Which AI tools do you use..."          │
│    [Insert Citation]                                    │
└─────────────────────────────────────────────────────────┘
```

**Step 3: User clicks "Insert Citation"**
```
→ UI inserts citation marker in text: [¹]
→ UI adds reference to References section:
  [¹] raw_so_2024_chunk_42 - Stack Overflow Developer Survey 2024, Q47
```

**Result**: The user never manually types `chunk_id` - the UI handles it!

### Alternative: Command-Line Citation Tool

For power users or LLM-generated insights:

```bash
# Search for chunk
$ cite search "Stack Overflow survey AI tools"
1. raw_so_2024_chunk_42 - Stack Overflow Developer Survey 2024, Q47
2. raw_so_2024_chunk_18 - Stack Overflow Developer Survey 2024, Q18

# Get citation reference
$ cite format raw_so_2024_chunk_42
[¹] raw_so_2024_chunk_42 - Stack Overflow Developer Survey 2024, Q47

# User copies this into their report
```

**The key**: Users don't need to know/remember chunk_ids - tools provide them!

---

## Complete Processing Pipeline

### Step 1: Insight Report Creation (Input)

**Human or LLM creates insight report** with inline citations that include `chunk_id`

```markdown
# Survey Analysis Q3 2024
Author: maher@alixpartners.com
Date: 2024-11-01

## Key Findings

Developer adoption of AI coding tools experienced dramatic growth in 2024,
with daily usage increasing from 10% to 34% year-over-year.[¹] This represents
a 240% increase in daily active users.

Enterprise adoption grew even faster at 280% YoY.[²] The convergence of
individual and organizational adoption suggests this technology shift is
permanent rather than experimental.

Productivity improvements of approximately 40% in debugging workflows[³] are
driving this rapid adoption across both individual developers and enterprises.

---

## References

[¹] raw_so_2024_chunk_42 - Stack Overflow Developer Survey 2024, Question 47
[²] raw_gartner_2024_chunk_18 - Gartner AI Development Tools Report 2024, Section 2.3
[³] raw_reddit_2024_chunk_91 - Reddit r/programming, top-rated discussion, August 2024
```

**This is the raw input** - a Markdown file with inline citation markers and a references section.

**Key format**: `[marker] chunk_id - human_readable_description`
- The `chunk_id` is the exact database identifier
- The description helps humans understand the source

---

### Step 2: Citation Parsing (Extract Chunk IDs)

Before chunking, we **parse the references section** to extract `chunk_id` directly from each citation.

**How this works**:

1. Extract all citation markers from the text: `[¹]`, `[²]`, `[³]`
2. Parse the References section to extract `chunk_id` from each citation
3. Build a citation map

#### Example Citation Parsing

**Citation format**: `[¹] chunk_id - description`

```python
def parse_references(report_text):
    """Extract chunk_ids from references section"""
    import re

    # Pattern: [marker] chunk_id - description
    # Example: [¹] raw_so_2024_chunk_42 - Stack Overflow Survey 2024, Q47
    pattern = r'\[([¹²³⁴⁵⁶⁷⁸⁹⁰\d]+)\]\s+(\w+_\w+_\w+_chunk_\d+)\s*-\s*(.+)'

    matches = re.findall(pattern, report_text)

    citation_map = {}
    for marker, chunk_id, description in matches:
        citation_map[f"[{marker}]"] = chunk_id

    return citation_map

# Parse the references
citation_map = parse_references(report_text)

# Returns:
# {
#   "[¹]": "raw_so_2024_chunk_42",
#   "[²]": "raw_gartner_2024_chunk_18",
#   "[³]": "raw_reddit_2024_chunk_91"
# }
```

**Advantages of this approach**:
- ✅ **Deterministic** - No ambiguous searches
- ✅ **Fast** - Simple regex parsing, no vector DB queries
- ✅ **Reliable** - Exact `chunk_id` reference, no matching errors
- ✅ **Simple** - No need for semantic search

**Important**: This parsing happens BEFORE chunking, so we know which chunk_ids to link to.

---

### Step 3: Semantic Chunking (Split Report into Chunks)

Now we chunk the report into logical units while **preserving citation information**.

#### Chunking Strategy

**Option A: Paragraph-level chunking** (simplest)
- Split by paragraphs
- Each paragraph becomes a chunk
- Citations within that paragraph are preserved

**Option B: Semantic chunking** (better)
- Use LLM to identify logical units (claims, findings, statements)
- Split where topic/claim changes
- May combine short paragraphs or split long ones

**Let's use Option A for this example** (paragraph-level):

#### Original Report Split into Chunks

**Chunk 1** (Paragraph 1):
```
Developer adoption of AI coding tools experienced dramatic growth in 2024,
with daily usage increasing from 10% to 34% year-over-year.[¹] This represents
a 240% increase in daily active users.
```
- **Citations found in this chunk**: `[¹]`
- **Chunk ID (assigned)**: `ins_survey_q3_chunk_5`

**Chunk 2** (Paragraph 2):
```
Enterprise adoption grew even faster at 280% YoY.[²] The convergence of
individual and organizational adoption suggests this technology shift is
permanent rather than experimental.
```
- **Citations found in this chunk**: `[²]`
- **Chunk ID (assigned)**: `ins_survey_q3_chunk_6`

**Chunk 3** (Paragraph 3):
```
Productivity improvements of approximately 40% in debugging workflows[³] are
driving this rapid adoption across both individual developers and enterprises.
```
- **Citations found in this chunk**: `[³]`
- **Chunk ID (assigned)**: `ins_survey_q3_chunk_7`

---

### Step 4: Extract Citations per Chunk

For each chunk, extract which citation markers appear in its text:

```python
def extract_citations(chunk_text):
    """Find all citation markers like [¹], [²], [³] in text"""
    import re
    pattern = r'\[(\d+|[¹²³⁴⁵⁶⁷⁸⁹⁰]+)\]'
    matches = re.findall(pattern, chunk_text)
    return [f"[{m}]" for m in matches]

# For Chunk 1:
chunk_1_citations = extract_citations("Developer adoption...year-over-year.[¹]...")
# Returns: ["[¹]"]

# For Chunk 2:
chunk_2_citations = extract_citations("Enterprise adoption...280% YoY.[²]...")
# Returns: ["[²]"]
```

**Result: Citation mapping per chunk**

```python
chunk_citations = {
  "ins_survey_q3_chunk_5": ["[¹]"],  # Cites raw_so_2024_chunk_42
  "ins_survey_q3_chunk_6": ["[²]"],  # Cites raw_gartner_2024_chunk_18
  "ins_survey_q3_chunk_7": ["[³]"]   # Cites raw_reddit_2024_chunk_91
}
```

---

### Step 5: Store Chunks in Vector DB

For each chunk, create an entry in the vector database:

```python
def store_insight_chunk(chunk_id, text, stage, author, created_at):
    """Store chunk in vector database"""

    # Generate embedding for semantic search
    embedding = embed_text(text)

    # Store in vector DB
    vector_db.insert({
        "chunk_id": chunk_id,
        "text": text,
        "embedding": embedding,
        "metadata": {
            "stage": stage,
            "type": "insight",
            "author": author,
            "created_at": created_at,
            "status": "published"
        }
    })
```

**Applied to our chunks**:

**Chunk 1 → Vector DB**:
```python
{
  "chunk_id": "ins_survey_q3_chunk_5",
  "text": "Developer adoption of AI coding tools experienced dramatic growth in 2024, with daily usage increasing from 10% to 34% year-over-year. This represents a 240% increase in daily active users.",
  "embedding": [0.23, -0.11, 0.67, ...],  # 1536-dim vector
  "metadata": {
    "stage": 1,
    "type": "insight",
    "author": "maher@alixpartners.com",
    "created_at": "2024-11-01T10:23:00Z",
    "status": "published"
  }
}
```

**Chunk 2 → Vector DB**:
```python
{
  "chunk_id": "ins_survey_q3_chunk_6",
  "text": "Enterprise adoption grew even faster at 280% YoY. The convergence of individual and organizational adoption suggests this technology shift is permanent rather than experimental.",
  "embedding": [0.31, -0.18, 0.72, ...],
  "metadata": {
    "stage": 1,
    "type": "insight",
    "author": "maher@alixpartners.com",
    "created_at": "2024-11-01T10:23:00Z",
    "status": "published"
  }
}
```

**Note**: Citations are NOT stored in vector DB metadata (they go in graph DB as edges)

---

### Step 6: Store Citations in Graph DB

For each chunk, create citation edges using the citation map from Step 2:

```python
def store_citations(chunk_id, citation_markers, citation_map):
    """Create citation edges in graph database"""

    for marker in citation_markers:
        # Resolve marker to target chunk_id
        target_chunk_id = citation_map[marker]

        # Create edge in graph DB
        graph_db.execute("""
            INSERT INTO citations (source_chunk_id, target_chunk_id, relationship_type)
            VALUES (?, ?, 'cites')
        """, chunk_id, target_chunk_id)
```

**Applied to our chunks**:

**Chunk 1 citations**:
```python
# ins_survey_q3_chunk_5 has citation [¹]
# [¹] maps to raw_so_2024_chunk_42

INSERT INTO citations (source_chunk_id, target_chunk_id, relationship_type)
VALUES ('ins_survey_q3_chunk_5', 'raw_so_2024_chunk_42', 'cites');
```

**Chunk 2 citations**:
```python
# ins_survey_q3_chunk_6 has citation [²]
# [²] maps to raw_gartner_2024_chunk_18

INSERT INTO citations (source_chunk_id, target_chunk_id, relationship_type)
VALUES ('ins_survey_q3_chunk_6', 'raw_gartner_2024_chunk_18', 'cites');
```

**Chunk 3 citations**:
```python
# ins_survey_q3_chunk_7 has citation [³]
# [³] maps to raw_reddit_2024_chunk_91

INSERT INTO citations (source_chunk_id, target_chunk_id, relationship_type)
VALUES ('ins_survey_q3_chunk_7', 'raw_reddit_2024_chunk_91', 'cites');
```

---

## Complete End-to-End Example

Let me show the FULL pipeline with code:

```python
# ============================================================================
# STEP 1: Input - Full insight report
# ============================================================================

insight_report = """
# Survey Analysis Q3 2024
Author: maher@alixpartners.com
Date: 2024-11-01

Developer adoption of AI coding tools experienced dramatic growth in 2024,
with daily usage increasing from 10% to 34% year-over-year.[¹] This represents
a 240% increase in daily active users.

Enterprise adoption grew even faster at 280% YoY.[²] The convergence of
individual and organizational adoption suggests this technology shift is
permanent rather than experimental.

## References
[¹] raw_so_2024_chunk_42 - Stack Overflow Developer Survey 2024, Question 47
[²] raw_gartner_2024_chunk_18 - Gartner AI Development Tools Report 2024, Section 2.3
"""

# ============================================================================
# STEP 2: Parse citations (extract chunk_ids directly)
# ============================================================================

def parse_references(report_text):
    """Extract chunk_ids from references section"""
    import re

    # Pattern: [marker] chunk_id - description
    pattern = r'\[([¹²³⁴⁵⁶⁷⁸⁹⁰\d]+)\]\s+(\w+_\w+_\w+_chunk_\d+)\s*-\s*(.+)'
    matches = re.findall(pattern, report_text)

    citation_map = {}
    for marker, chunk_id, description in matches:
        citation_map[f"[{marker}]"] = chunk_id

    return citation_map

citation_map = parse_references(insight_report)

# Result:
# citation_map = {
#   "[¹]": "raw_so_2024_chunk_42",
#   "[²]": "raw_gartner_2024_chunk_18"
# }

# ============================================================================
# STEP 3: Chunk the report
# ============================================================================

def chunk_report(report_text):
    """Split report into paragraphs (simple chunking)"""
    # Remove header and references
    body = extract_body(report_text)

    # Split by double newlines (paragraphs)
    chunks = [p.strip() for p in body.split('\n\n') if p.strip()]

    return chunks

chunks = chunk_report(insight_report)

# Result:
# chunks = [
#   "Developer adoption of AI coding tools experienced dramatic growth...[¹]...",
#   "Enterprise adoption grew even faster at 280% YoY.[²]..."
# ]

# ============================================================================
# STEP 4: Extract citations per chunk
# ============================================================================

def extract_citations_from_chunk(chunk_text):
    """Find all citation markers in chunk text"""
    import re
    pattern = r'\[(\d+|[¹²³⁴⁵⁶⁷⁸⁹⁰]+)\]'
    matches = re.findall(pattern, chunk_text)
    return [f"[{m}]" for m in matches]

chunk_citations_list = []
for chunk_text in chunks:
    citations = extract_citations_from_chunk(chunk_text)
    chunk_citations_list.append(citations)

# Result:
# chunk_citations_list = [
#   ["[¹]"],  # Chunk 1 citations
#   ["[²]"]   # Chunk 2 citations
# ]

# ============================================================================
# STEP 5: Store in Vector DB + Graph DB
# ============================================================================

def process_insight_report(
    report_text,
    author,
    stage,
    vector_db,
    graph_db
):
    """Complete pipeline: report → chunks → databases"""

    # Step 2: Parse citations (extract chunk_ids)
    citation_map = parse_references(report_text)

    # Step 3: Chunk report
    chunks = chunk_report(report_text)

    # Step 4 & 5: Process each chunk
    for idx, chunk_text in enumerate(chunks):
        # Assign chunk ID
        chunk_id = f"ins_survey_q3_chunk_{idx + 5}"

        # Extract citations in this chunk
        citations = extract_citations_from_chunk(chunk_text)

        # Step 5a: Store in VECTOR DB
        embedding = embed_text(chunk_text)
        vector_db.insert({
            "chunk_id": chunk_id,
            "text": chunk_text,
            "embedding": embedding,
            "metadata": {
                "stage": stage,
                "type": "insight",
                "author": author,
                "created_at": now(),
                "status": "published"
            }
        })

        # Step 5b: Store citations in GRAPH DB
        for citation_marker in citations:
            target_chunk_id = citation_map[citation_marker]
            graph_db.execute("""
                INSERT INTO citations
                (source_chunk_id, target_chunk_id, relationship_type)
                VALUES (?, ?, 'cites')
            """, chunk_id, target_chunk_id)

        print(f"✅ Created {chunk_id} with {len(citations)} citations")

# Execute the full pipeline
process_insight_report(
    insight_report,
    author="maher@alixpartners.com",
    stage=1,
    vector_db=vector_db,
    graph_db=graph_db
)
```

**Output**:
```
✅ Created ins_survey_q3_chunk_5 with 1 citations
✅ Created ins_survey_q3_chunk_6 with 1 citations
```

---

## Final State: What's in the Databases

### Vector DB (Content)

```python
# Chunk 1
{
  "chunk_id": "ins_survey_q3_chunk_5",
  "text": "Developer adoption of AI coding tools experienced dramatic growth in 2024, with daily usage increasing from 10% to 34% year-over-year. This represents a 240% increase in daily active users.",
  "embedding": [0.23, -0.11, 0.67, ...],
  "metadata": {"stage": 1, "type": "insight", "author": "maher@alixpartners.com"}
}

# Chunk 2
{
  "chunk_id": "ins_survey_q3_chunk_6",
  "text": "Enterprise adoption grew even faster at 280% YoY. The convergence of individual and organizational adoption suggests this technology shift is permanent rather than experimental.",
  "embedding": [0.31, -0.18, 0.72, ...],
  "metadata": {"stage": 1, "type": "insight", "author": "maher@alixpartners.com"}
}
```

### Graph DB (Relationships)

```sql
-- Citations table
source_chunk_id          | target_chunk_id           | relationship_type
-------------------------|---------------------------|------------------
ins_survey_q3_chunk_5    | raw_so_2024_chunk_42      | cites
ins_survey_q3_chunk_6    | raw_gartner_2024_chunk_18 | cites
```

**Citation graph**:
```
ins_survey_q3_chunk_5 (Stage 1) → raw_so_2024_chunk_42 (Stage 0)
ins_survey_q3_chunk_6 (Stage 1) → raw_gartner_2024_chunk_18 (Stage 0)
```

---

## Advanced Case: Chunk with Multiple Citations

What if a single chunk cites multiple sources?

```markdown
The AI tools market saw explosive growth, with daily usage up 240%[¹] and
enterprise adoption up 280%[²]. Developers report 40% productivity gains.[³]
```

**Processing**:

```python
# This is ONE chunk (single paragraph)
chunk_text = "The AI tools market saw explosive growth, with daily usage up 240%[¹] and enterprise adoption up 280%[²]. Developers report 40% productivity gains.[³]"

# Extract citations
citations = extract_citations_from_chunk(chunk_text)
# Returns: ["[¹]", "[²]", "[³]"]

# Store in vector DB (one entry)
chunk_id = "ins_trends_chunk_8"
vector_db.insert({
    "chunk_id": chunk_id,
    "text": chunk_text,
    "embedding": embed_text(chunk_text),
    "metadata": {"stage": 2, "type": "insight"}
})

# Store in graph DB (THREE edges)
for marker in ["[¹]", "[²]", "[³]"]:
    target = citation_map[marker]
    graph_db.execute("""
        INSERT INTO citations (source_chunk_id, target_chunk_id, relationship_type)
        VALUES (?, ?, 'cites')
    """, chunk_id, target)
```

**Result in graph DB**:
```sql
source_chunk_id      | target_chunk_id
---------------------|----------------------------
ins_trends_chunk_8   | raw_so_2024_chunk_42       (from [¹])
ins_trends_chunk_8   | raw_gartner_2024_chunk_18  (from [²])
ins_trends_chunk_8   | raw_reddit_2024_chunk_91   (from [³])
```

**One chunk → Multiple citation edges**

---

## Stage 2 Insights (Compounding Effect)

Now let's show how Stage 2 (synthesis) works when citing Stage 1 insights.

### Input: Stage 2 Report Citing Stage 1 Insights

```markdown
# AI Adoption Trends 2024
Author: manil@alixpartners.com
Date: 2024-11-05

The AI development tools market saw explosive growth in 2024, with daily
developer usage increasing 240% year-over-year,[³] and enterprise adoption
growing even faster at 280% YoY.[⁴] Productivity improvements of ~40%[⁵]
are driving this rapid adoption.

## References
[³] ins_survey_q3_chunk_5 - Survey Analysis Q3 2024 (Maher, 2024)
[⁴] raw_gartner_2024_chunk_18 - Gartner AI Development Tools Report 2024, Section 2.3
[⁵] ins_sentiment_chunk_12 - Developer Sentiment Analysis 2024 (Maher, 2024)
```

**Notice**: Citations [³] and [⁵] include `chunk_id` for OTHER INSIGHTS (Stage 1), not raw data!
**Citation [⁴]** is raw data (Stage 0)

### Citation Parsing (Step 2)

```python
# Parse references to extract chunk_ids
citation_map = parse_references(report_text)

# Result:
# {
#   "[³]": "ins_survey_q3_chunk_5",      ← Stage 1 insight!
#   "[⁴]": "raw_gartner_2024_chunk_18",  ← Stage 0 raw data
#   "[⁵]": "ins_sentiment_chunk_12"      ← Stage 1 insight!
# }
```

**Key point**: The citation map includes BOTH raw data chunks AND insight chunks - the system handles both naturally!

### Processing (Steps 3-5)

```python
# Chunk the report (assume single paragraph for simplicity)
chunk_text = "The AI development tools market saw explosive growth in 2024, with daily developer usage increasing 240% year-over-year, and enterprise adoption growing even faster at 280% YoY. Productivity improvements of ~40% are driving this rapid adoption."

chunk_id = "ins_trends_chunk_8"

# Store in Vector DB
vector_db.insert({
    "chunk_id": chunk_id,
    "text": chunk_text,
    "embedding": embed_text(chunk_text),
    "metadata": {
        "stage": 2,  # ← Stage 2 (synthesis)
        "type": "insight",
        "author": "manil@alixpartners.com"
    }
})

# Store citations in Graph DB
citations = ["[³]", "[⁴]", "[⁵]"]
for marker in citations:
    target = citation_map[marker]
    graph_db.execute("""
        INSERT INTO citations (source_chunk_id, target_chunk_id, relationship_type)
        VALUES (?, ?, 'cites')
    """, chunk_id, target)
```

### Result: Citation Graph with Compounding

```sql
-- Graph DB now has:
source_chunk_id      | target_chunk_id
---------------------|----------------------------
ins_trends_chunk_8   | ins_survey_q3_chunk_5      (Stage 2 → Stage 1)
ins_trends_chunk_8   | raw_gartner_2024_chunk_18  (Stage 2 → Stage 0)
ins_trends_chunk_8   | ins_sentiment_chunk_12     (Stage 2 → Stage 1)
```

**But remember** from earlier:
```sql
ins_survey_q3_chunk_5 | raw_so_2024_chunk_42      (Stage 1 → Stage 0)
ins_sentiment_chunk_12| raw_reddit_2024_chunk_91  (Stage 1 → Stage 0)
```

**Full citation graph** (compounding!):
```
ins_trends_chunk_8 (Stage 2)
    ├── ins_survey_q3_chunk_5 (Stage 1)
    │       └── raw_so_2024_chunk_42 (Stage 0)
    ├── raw_gartner_2024_chunk_18 (Stage 0)
    └── ins_sentiment_chunk_12 (Stage 1)
            └── raw_reddit_2024_chunk_91 (Stage 0)
```

**The beauty**: We only store direct edges, but recursive queries give us the full tree!

---

## Edge Cases and Solutions

### Edge Case 1: Invalid or Missing Chunk ID

**Problem**: Citation marker [⁴] references `raw_gartner_2024_chunk_999` but that chunk doesn't exist in the database.

**Solution**:
```python
def validate_citation(chunk_id, vector_db):
    """Verify that cited chunk_id exists in database"""

    # Check if chunk exists
    chunk = vector_db.get(chunk_id)

    if chunk is None:
        return False, f"Chunk '{chunk_id}' not found in database"

    return True, chunk

def parse_and_validate_references(report_text, vector_db):
    """Parse references and validate all chunk_ids exist"""

    citation_map = parse_references(report_text)
    errors = []

    for marker, chunk_id in citation_map.items():
        valid, result = validate_citation(chunk_id, vector_db)

        if not valid:
            errors.append(f"⚠️ Citation {marker}: {result}")

    if errors:
        print("Citation validation errors:")
        for error in errors:
            print(error)
        raise ValueError("Invalid citations found - please fix before processing")

    return citation_map
```

**This prevents broken citations** from being stored in the graph database.

### Edge Case 2: Single Chunk with Mixed Citation Types

**Scenario**: Chunk cites both raw data AND other insights

```markdown
Growth patterns[¹] align with productivity gains[²], suggesting sustainable adoption.

[¹] Survey Analysis Q3 2024 (insight)
[²] Gartner Report 2024 (raw data)
```

**Processing**:
```python
citation_map = {
    "[¹]": "ins_survey_q3_chunk_5",      # Insight (Stage 1)
    "[²]": "raw_gartner_2024_chunk_18"   # Raw data (Stage 0)
}

# Store chunk
chunk_id = "ins_synthesis_chunk_3"
# ... (same as before)

# Store citations (works the same!)
for marker in ["[¹]", "[²]"]:
    target = citation_map[marker]
    graph_db.execute("""
        INSERT INTO citations (source_chunk_id, target_chunk_id, relationship_type)
        VALUES (?, ?, 'cites')
    """, chunk_id, target)
```

**Graph DB edges**:
```
ins_synthesis_chunk_3 → ins_survey_q3_chunk_5 (Stage 1 → Stage 1)
ins_synthesis_chunk_3 → raw_gartner_2024_chunk_18 (Stage 1 → Stage 0)
```

**No problem!** The system handles mixed citation types naturally.

### Edge Case 3: Chunking Splits a Citation

**Problem**: Semantic chunking splits text mid-sentence, orphaning a citation

Original text:
```
Enterprise adoption grew 280% YoY.[²] This
indicates strong organizational buy-in.
```

Bad chunking splits it:
```
Chunk 1: "Enterprise adoption grew 280% YoY.[²]"
Chunk 2: "This indicates strong organizational buy-in."
```

**Solution**: Keep citation markers with their context during chunking

```python
def semantic_chunk_with_citation_awareness(text):
    """Chunk text but keep citations with their referenced content"""

    # Use LLM to identify logical units
    chunks = llm_chunk(text)

    # Post-process: if citation marker is isolated, merge with previous chunk
    final_chunks = []
    for i, chunk in enumerate(chunks):
        # Check if chunk is just a citation or starts with citation
        if re.match(r'^\[\d+\]', chunk.strip()):
            # Merge with previous chunk
            final_chunks[-1] += " " + chunk
        else:
            final_chunks.append(chunk)

    return final_chunks
```

---

## Summary: The Complete Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ INPUT: Insight Report (Markdown with inline citations)      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Parse References Section                            │
│ Extract chunk_ids directly from citations                    │
│   [¹] raw_so_2024_chunk_42 - Stack Overflow Survey...       │
│   [²] raw_gartner_2024_chunk_18 - Gartner Report...         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Build Citation Map (Parse Chunk IDs)                │
│ Regex parse to extract chunk_id from each citation           │
│   [¹] → raw_so_2024_chunk_42                                │
│   [²] → raw_gartner_2024_chunk_18                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Chunk Report (Paragraph or Semantic)                │
│ Split into logical units                                     │
│   Chunk 1: "Developer adoption...240%[¹]..."                │
│   Chunk 2: "Enterprise adoption...280%[²]..."               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Extract Citations per Chunk                         │
│ For each chunk, find which citations appear in text          │
│   Chunk 1 → [¹]                                             │
│   Chunk 2 → [²]                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5a: Store Chunks in VECTOR DB                          │
│ For each chunk:                                              │
│   - Assign chunk_id                                          │
│   - Generate embedding                                       │
│   - Store {chunk_id, text, embedding, metadata}             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5b: Store Citations in GRAPH DB                        │
│ For each chunk:                                              │
│   - For each citation in chunk, create edge                  │
│   - INSERT (source_chunk_id, target_chunk_id, 'cites')      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ OUTPUT: Dual Database State                                 │
│                                                              │
│ Vector DB: Chunks with embeddings (searchable)              │
│ Graph DB: Citation edges (lineage traversal)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Insights

1. **Citations include chunk_id directly in the reference**
   - Format: `[¹] chunk_id - human_readable_description`
   - Example: `[¹] raw_so_2024_chunk_42 - Stack Overflow Survey 2024, Q47`
   - No need for vector DB searches to resolve citations!

2. **Citation parsing happens BEFORE chunking**
   - Parse references section with regex to extract chunk_ids
   - Build citation_map: marker → chunk_id
   - This map is used after chunking to create graph edges

3. **Chunking preserves citation markers in text**
   - Each chunk keeps its inline citations like [¹], [²]
   - We extract these markers to know which edges to create

4. **Vector DB stores content only**
   - No citation information in metadata
   - Just text + embedding for search

5. **Graph DB stores relationships only**
   - Each citation = one edge
   - Multiple citations in one chunk = multiple edges

6. **The system handles any stage naturally**
   - Stage 1 (raw → insights): Citations include raw data chunk_ids
   - Stage 2 (insights → synthesis): Citations include insight chunk_ids
   - Stage 3+ (synthesis → executive): Same process, deeper lineage

7. **No duplication, no compounding complexity**
   - Each chunk stores only what it contains
   - Each edge stores only the direct relationship
   - Full lineage computed on-demand via recursive queries

8. **Advantages of chunk_id in citations**
   - ✅ Deterministic - exact reference, no ambiguity
   - ✅ Fast - simple regex parsing vs semantic search
   - ✅ Reliable - no risk of matching wrong chunk
   - ✅ Validatable - can verify chunk exists before processing

This pipeline seamlessly feeds into the dual-database architecture described in `database-workflow-examples.md`!
