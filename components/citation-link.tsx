/**
 * Interactive citation marker component that shows popover on hover and opens lineage on click.
 *
 * Input data sources: Chunk data from parent component
 * Output destinations: Triggers onViewFull callback for lineage sheet
 * Dependencies: CitationPopover component, Chunk type
 * Key exports: CitationLink component
 * Side effects: None
 */

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
