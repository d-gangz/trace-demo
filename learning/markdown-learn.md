<!--
Document Type: Learning Notes
Purpose: Understanding markdown rendering with ReactMarkdown, Tailwind Typography, and styling
Context: Created while implementing citation lineage demo with proper markdown rendering
Key Topics: ReactMarkdown, remarkGfm, Tailwind Typography plugin, prose classes, CSS descendant selectors
Target Use: Reference for understanding how markdown styling works in React applications
-->

# Markdown Rendering Learning Notes

## The Problem We Solved

When rendering markdown in the citation lineage demo, headings and paragraphs weren't displaying with proper styling - everything appeared as plain text without visual hierarchy.

## Root Cause

Using classes like `prose`, `prose-slate`, `dark:prose-invert` without the `@tailwindcss/typography` plugin installed. **These classes don't exist in core Tailwind CSS** - they're provided exclusively by the Typography plugin.

Without the plugin:
- Tailwind looks for `prose` classes but can't find them
- The classes are simply ignored
- No styling is applied to markdown elements

## The Solution Stack

### 1. ReactMarkdown
**Purpose:** Converts markdown syntax to HTML elements

```tsx
import ReactMarkdown from "react-markdown";

<ReactMarkdown>{markdown}</ReactMarkdown>
```

**What it does:**
```markdown
# Title       →  <h1>Title</h1>
## Subtitle   →  <h2>Subtitle</h2>
**bold**      →  <strong>bold</strong>
Paragraph     →  <p>Paragraph</p>
```

**Important:** ReactMarkdown just converts markdown to HTML - it doesn't add styling or classes!

### 2. remarkGfm Plugin
**Purpose:** Parsing plugin for GitHub Flavored Markdown features

```tsx
import remarkGfm from "remark-gfm";

<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {markdown}
</ReactMarkdown>
```

**Adds support for:**
- ✅ Tables
- ✅ Strikethrough (`~~text~~`)
- ✅ Task lists (`- [ ] todo item`)
- ✅ Autolinks (URLs become clickable)

**Not for styling!** This is purely about parsing additional markdown syntax.

### 3. Tailwind Typography Plugin
**Purpose:** Provides pre-designed typography styles via the `prose` class

**Installation:**
```bash
bun add @tailwindcss/typography
```

**Configuration (app/globals.css):**
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

**Usage:**
```tsx
<div className="prose prose-slate dark:prose-invert max-w-none">
  <ReactMarkdown>{markdown}</ReactMarkdown>
</div>
```

## How the `prose` Class Works

### It's NOT CSS Inheritance
The Typography plugin uses **CSS descendant selectors**, not inheritance.

**How it works:**
```tsx
// HTML structure
<div className="prose">
  <h1>Title</h1>      // ← Gets styled
  <h2>Subtitle</h2>   // ← Gets styled
  <p>Paragraph</p>    // ← Gets styled
</div>
```

**Generated CSS (simplified):**
```css
.prose h1 {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 0.8888889em;
}

.prose h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 2em;
  margin-bottom: 1em;
}

.prose p {
  margin-top: 1.25em;
  margin-bottom: 1.25em;
}
/* ...and hundreds more rules */
```

### Key Insight
- `.prose` = Container that "activates" the styling context
- `.prose h1` = "Any `<h1>` that's a descendant of `.prose`"
- `.prose p` = "Any `<p>` that's a descendant of `.prose`"

The Typography plugin's CSS "reaches down" into the DOM tree and styles elements automatically.

## Works With Any HTML Content

The Typography plugin isn't specific to ReactMarkdown:

```tsx
// Works with ReactMarkdown
<div className="prose">
  <ReactMarkdown>{markdown}</ReactMarkdown>
</div>

// Works with plain HTML
<div className="prose">
  <h1>Hello</h1>
  <p>World</p>
</div>

// Works with dangerouslySetInnerHTML
<div className="prose" dangerouslySetInnerHTML={{ __html: htmlString }} />
```

## Custom Components in ReactMarkdown

You can override how specific elements render using the `components` prop:

### Without Typography Plugin (Manual Styling)
```tsx
<ReactMarkdown
  components={{
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-semibold mb-3 mt-6">{children}</h2>
    ),
    p: ({ children }) => (
      <p className="text-base leading-relaxed mb-4">{children}</p>
    ),
    // ... and so on for every element type
  }}
>
  {markdown}
</ReactMarkdown>
```

### With Typography Plugin (Custom Logic Only)
```tsx
<div className="prose">
  <ReactMarkdown
    components={{
      p: ({ children, ...props }) => (
        <p {...props}>  {/* No className needed, prose handles it */}
          {processCustomLogic(children)}
        </p>
      ),
      h1: ({ children, ...props }) => (
        <h1 {...props}>  {/* Styling comes from .prose h1 */}
          {processCustomLogic(children)}
        </h1>
      ),
    }}
  >
    {markdown}
  </ReactMarkdown>
</div>
```

**In our citation demo:** We use custom components to inject citation processing logic, not for styling!

## The Complete Flow

```
1. remarkGfm
   ↓ Parses GFM features (tables, strikethrough, etc.)

2. ReactMarkdown
   ↓ Converts markdown to HTML elements

3. Custom components (optional)
   ↓ Inject custom logic (e.g., citation processing)

4. prose class + Typography plugin
   ↓ Automatically styles all elements
```

## Available prose Variants

```tsx
// Base
className="prose"

// Color schemes
className="prose prose-slate"
className="prose prose-gray"
className="prose prose-zinc"

// Dark mode
className="dark:prose-invert"

// Size control
className="prose max-w-none"  // Remove max-width
className="prose prose-sm"     // Smaller
className="prose prose-lg"     // Larger
```

## Summary Table

| Tool | Purpose | Required? |
|------|---------|-----------|
| **ReactMarkdown** | Converts markdown → HTML | ✅ Yes |
| **remarkGfm** | Parses GFM features | Optional (if you need tables, etc.) |
| **Typography plugin** | Provides styling via `.prose` | ✅ Yes (for automatic styling) |
| **Custom components** | Custom rendering logic | Optional (for special behavior) |

## Key Takeaways

1. **ReactMarkdown doesn't style anything** - it just converts markdown to HTML
2. **remarkGfm is for parsing, not styling** - adds support for GFM syntax
3. **Typography plugin is what provides the styling** - via the `prose` class
4. **`prose` uses descendant selectors** - not inheritance, it targets child elements
5. **Custom components are for logic** - not styling (when using Typography plugin)
6. **Without Typography plugin** - you must manually style every element type

## Implementation in Citation Demo

**File:** `components/insight-report.tsx`

```tsx
return (
  <div className="prose prose-slate dark:prose-invert max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom renderers to process citations
        p: ({ children, ...props }) => (
          <p {...props}>
            {processTextWithCitations(children, citationMap, chunks, onCitationClick)}
          </p>
        ),
        h1: ({ children, ...props }) => (
          <h1 {...props}>
            {processTextWithCitations(children, citationMap, chunks, onCitationClick)}
          </h1>
        ),
        // ... more elements
      }}
    >
      {contentWithoutReferences}
    </ReactMarkdown>
  </div>
);
```

**Why custom components?** To inject citation link processing, while letting the Typography plugin handle all styling automatically!
