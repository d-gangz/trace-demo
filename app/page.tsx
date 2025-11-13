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
            Hover over citations to see source preview, click &quot;View Full&quot; to
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
