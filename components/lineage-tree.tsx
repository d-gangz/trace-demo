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
  const { chunk, children } = node;

  const stageBadgeColor =
    {
      0: "bg-gray-500 text-white",
      1: "bg-blue-500 text-white",
      2: "bg-purple-500 text-white",
    }[chunk.stage] || "bg-gray-500 text-white";

  const typeIcon = chunk.type === "raw" ? "📄" : "📊";

  // Connection line styling
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
        <div className="absolute left-4 top-6 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600" />
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
