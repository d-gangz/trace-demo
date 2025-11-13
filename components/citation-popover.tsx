/**
 * Popover component displaying citation source preview with stage badge and metadata.
 *
 * Input data sources: Chunk data from parent component
 * Output destinations: Triggers onViewFull callback for full lineage view
 * Dependencies: shadcn/ui components (Popover, Badge, Button, Separator), Chunk type
 * Key exports: CitationPopover component
 * Side effects: None
 */

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
