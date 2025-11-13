/**
 * Recursive tree component for visualizing citation lineage with connection lines and metadata.
 *
 * Input data sources: LineageNode array from server actions
 * Output destinations: Visual tree display in lineage sheet
 * Dependencies: shadcn/ui components (Badge, Card), LineageNode type
 * Key exports: LineageTree component
 * Side effects: None
 */

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
      {nodes.map((node) => (
        <TreeNode
          key={node.chunk_id}
          node={node}
          level={level}
        />
      ))}
    </div>
  );
}

interface TreeNodeProps {
  node: LineageNode;
  level: number;
}

function TreeNode({ node, level }: TreeNodeProps) {
  const { chunk, children, citation_marker } = node;

  const badgeColor = chunk.type === "insight"
    ? "bg-blue-500 text-white"
    : "bg-gray-500 text-white";

  return (
    <div className="relative">
      {/* Node content */}
      <Card
        className={`p-4 ${
          level > 0 ? "ml-8" : ""
        } border-gray-200 dark:border-gray-700`}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {citation_marker && (
              <span className="text-sm text-muted-foreground">{citation_marker}</span>
            )}
            <Badge className={badgeColor}>{chunk.chunk_id}</Badge>
          </div>

          <p className="text-sm leading-relaxed">{chunk.text}</p>

          {chunk.type === "raw" && chunk.source_title && (
            <p className="text-xs text-muted-foreground italic">
              Source: {chunk.source_title}
            </p>
          )}

          {chunk.author && (
            <p className="text-xs text-muted-foreground">
              by {chunk.author.split("@")[0]}
            </p>
          )}
          {chunk.created_at && (
            <p className="text-xs text-muted-foreground">
              {new Date(chunk.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </Card>

      {/* Recursive render of children */}
      {children.length > 0 && (
        <div className="mt-3">
          <LineageTree nodes={children} level={level + 1} />
        </div>
      )}
    </div>
  );
}
