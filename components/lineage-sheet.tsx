/**
 * Side sheet component that fetches and displays complete citation lineage tree.
 *
 * Input data sources: Chunk ID from parent, chunk data and lineage from server actions
 * Output destinations: Visual lineage tree display in side panel
 * Dependencies: shadcn/ui Sheet components, LineageTree, server actions (getChunk, getFullLineage)
 * Key exports: LineageSheet component
 * Side effects: Fetches data from database via server actions when opened
 */

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
