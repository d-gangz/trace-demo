/**
 * Markdown renderer component that replaces citation markers with interactive CitationLink components.
 *
 * Input data sources: Markdown string with citation references, chunk data from server actions
 * Output destinations: Rendered report with interactive citations, triggers citation click callbacks
 * Dependencies: react-markdown, remark-gfm, CitationLink, lib/markdown-utils, actions/lineage
 * Key exports: InsightReport component
 * Side effects: Fetches chunk data from database via server actions
 */

"use client";

import { useEffect, useMemo, useState } from "react";
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
  // Parse citation map from markdown (memoized computation)
  const citationMap = useMemo(() => parseCitationMap(markdown), [markdown]);
  const [chunks, setChunks] = useState<Record<string, Chunk | null>>({});

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
