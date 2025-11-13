/**
 * Database seed script that populates the citation lineage demo with multi-stage research data.
 *
 * Input data sources: Hardcoded seed data in this file (10 raw chunks, 8 stage-1 insights, 4 stage-2 synthesis)
 * Output destinations: SQLite database at data/trace-demo.db (content and citations tables)
 * Dependencies: Database utilities from ./index (getDb, initDb)
 * Key exports: seed function
 * Side effects: Clears and repopulates database tables with demo data
 */

import { getDb, initDb } from "./index";

function seed() {
  // Initialize database schema
  initDb();

  const db = getDb();

  // Clear existing data
  db.prepare("DELETE FROM citations").run();
  db.prepare("DELETE FROM content").run();

  console.log("🗑️  Cleared existing data");

  // ===== STAGE 0: Raw Data Chunks (10 total) =====
  const stage0: Array<{
    chunk_id: string;
    text: string;
    stage: number;
    type: string;
    author?: string;
    created_at?: string;
    source_title?: string;
  }> = [
    {
      chunk_id: "raw_market_survey_chunk_1",
      text: "Q3 2024 market survey reveals 78% adoption rate of AI-powered analytics tools across enterprise segments, up from 52% in Q2 2024. Survey methodology: 500 enterprise decision-makers across technology, finance, and healthcare sectors.",
      stage: 0,
      type: "raw",
      source_title: "Enterprise AI Adoption Survey Q3 2024",
      created_at: "2024-10-15T09:00:00Z",
    },
    {
      chunk_id: "raw_competitor_report_chunk_2",
      text: "Competitor analysis indicates that CompanyX holds 45% market share in the AI analytics segment, followed by CompanyY at 28% and emerging players at 27%. CompanyX strength lies in enterprise integration capabilities.",
      stage: 0,
      type: "raw",
      source_title: "Market Intelligence Report: AI Analytics Vendors",
      created_at: "2024-10-18T14:30:00Z",
    },
    {
      chunk_id: "raw_customer_feedback_chunk_3",
      text: "Customer satisfaction scores show 32% year-over-year improvement, with NPS increasing from 42 to 56. Primary satisfaction drivers: ease of integration (89%), accuracy of insights (86%), and support responsiveness (82%).",
      stage: 0,
      type: "raw",
      source_title: "Customer Satisfaction Analysis Q3 2024",
      created_at: "2024-10-20T11:15:00Z",
    },
    {
      chunk_id: "raw_industry_analysis_chunk_4",
      text: "Industry forecast projects 18% CAGR for AI analytics market through 2028, driven by increasing data volumes, regulatory compliance requirements, and competitive pressure for data-driven decision making.",
      stage: 0,
      type: "raw",
      source_title: "Gartner Industry Forecast 2024-2028",
      created_at: "2024-10-22T08:45:00Z",
    },
    {
      chunk_id: "raw_financial_data_chunk_5",
      text: "Financial performance: Revenue growth of 24% YoY in Q3 2024, reaching $145M. EBITDA margin improved from 18% to 22%. Customer acquisition cost decreased 15% while lifetime value increased 31%.",
      stage: 0,
      type: "raw",
      source_title: "Q3 2024 Financial Report",
      created_at: "2024-10-25T16:00:00Z",
    },
    {
      chunk_id: "raw_tech_trends_chunk_6",
      text: "Technology adoption patterns show 67% of enterprises now using cloud-based analytics platforms, up from 45% in 2023. Migration drivers: scalability (91%), cost reduction (78%), and remote workforce enablement (72%).",
      stage: 0,
      type: "raw",
      source_title: "Cloud Analytics Adoption Report 2024",
      created_at: "2024-10-26T10:00:00Z",
    },
    {
      chunk_id: "raw_pricing_analysis_chunk_7",
      text: "Pricing strategy analysis reveals average contract value increased 18% YoY to $285K annually. Enterprise tier adoption grew 34%, while SMB segment showed 12% growth. Upsell rate reached 41% of existing customer base.",
      stage: 0,
      type: "raw",
      source_title: "Pricing and Revenue Analysis Q3 2024",
      created_at: "2024-10-27T13:20:00Z",
    },
    {
      chunk_id: "raw_security_compliance_chunk_8",
      text: "Security audit reports 99.97% uptime and zero critical security incidents in Q3 2024. SOC 2 Type II certified, GDPR compliant, and ISO 27001 certified. Data encryption at rest and in transit using AES-256.",
      stage: 0,
      type: "raw",
      source_title: "Security and Compliance Audit Q3 2024",
      created_at: "2024-10-28T09:30:00Z",
    },
    {
      chunk_id: "raw_user_engagement_chunk_9",
      text: "User engagement metrics: Daily active users increased 42% QoQ, average session duration up 28% to 34 minutes, and feature adoption rate at 73% for newly released capabilities. Power users (20% of base) generate 68% of queries.",
      stage: 0,
      type: "raw",
      source_title: "Product Analytics Dashboard Q3 2024",
      created_at: "2024-10-29T15:45:00Z",
    },
    {
      chunk_id: "raw_market_expansion_chunk_10",
      text: "Geographic expansion analysis: North America 52% of revenue, EMEA 31%, APAC 17%. Fastest growth in APAC (+89% YoY), driven by Singapore, Japan, and Australia markets. Regulatory approval obtained in 8 new countries.",
      stage: 0,
      type: "raw",
      source_title: "Geographic Market Analysis 2024",
      created_at: "2024-10-30T11:00:00Z",
    },
  ];

  // ===== STAGE 1: First-Order Insights (8 total) =====
  const stage1: Array<{
    chunk_id: string;
    text: string;
    stage: number;
    type: string;
    author?: string;
    created_at?: string;
    source_title?: string;
  }> = [
    {
      chunk_id: "ins_market_trends_chunk_1",
      text: "Market adoption has accelerated significantly, with enterprise AI analytics adoption reaching 78% in Q3 2024[1]. This 26 percentage point increase from Q2 indicates rapid mainstream adoption beyond early adopters. The growth is particularly pronounced in regulated industries where data-driven compliance has become mandatory.",
      stage: 1,
      type: "insight",
      author: "sarah.chen@consulting.com",
      created_at: "2024-10-28T10:30:00Z",
    },
    {
      chunk_id: "ins_competitive_position_chunk_2",
      text: "Current market structure shows clear leader-challenger dynamics, with CompanyX commanding 45% share through superior enterprise integration[1]. However, the 27% held by emerging players suggests market consolidation pressure and potential disruption risk from specialized entrants.",
      stage: 1,
      type: "insight",
      author: "michael.rodriguez@consulting.com",
      created_at: "2024-10-29T14:20:00Z",
    },
    {
      chunk_id: "ins_customer_sentiment_chunk_3",
      text: "Customer satisfaction improvements of 32% YoY with NPS rising to 56[1] signal strong product-market fit. Integration ease emerges as the dominant value driver (89% satisfaction), indicating that technical compatibility outweighs pure analytical capabilities in purchase decisions.",
      stage: 1,
      type: "insight",
      author: "sarah.chen@consulting.com",
      created_at: "2024-10-30T09:15:00Z",
    },
    {
      chunk_id: "ins_financial_performance_chunk_4",
      text: "Financial metrics demonstrate healthy unit economics with 24% revenue growth and margin expansion from 18% to 22%[1]. The simultaneous 15% CAC reduction and 31% LTV increase indicates improving operational efficiency and product stickiness.",
      stage: 1,
      type: "insight",
      author: "james.wilson@consulting.com",
      created_at: "2024-10-31T11:45:00Z",
    },
    {
      chunk_id: "ins_cloud_migration_chunk_5",
      text: "Cloud platform adoption reached 67% in 2024, up from 45% in 2023[1], representing a fundamental shift in enterprise infrastructure strategy. The primary migration drivers—scalability (91%), cost reduction (78%), and remote workforce enablement (72%)—align with broader digital transformation priorities.",
      stage: 1,
      type: "insight",
      author: "david.park@consulting.com",
      created_at: "2024-11-01T10:00:00Z",
    },
    {
      chunk_id: "ins_pricing_strategy_chunk_6",
      text: "Revenue per customer increased 18% YoY to $285K annually[1], driven primarily by enterprise tier growth of 34%. The 41% upsell rate among existing customers indicates strong value realization and expansion opportunities within the installed base.",
      stage: 1,
      type: "insight",
      author: "maria.gonzalez@consulting.com",
      created_at: "2024-11-01T14:30:00Z",
    },
    {
      chunk_id: "ins_product_engagement_chunk_7",
      text: "User engagement patterns show 42% QoQ growth in daily active users with session duration increasing to 34 minutes[1]. The concentration of activity among power users (20% generating 68% of queries) suggests successful cultivation of high-value user segments.",
      stage: 1,
      type: "insight",
      author: "robert.kim@consulting.com",
      created_at: "2024-11-02T09:20:00Z",
    },
    {
      chunk_id: "ins_geographic_expansion_chunk_8",
      text: "Geographic revenue distribution shows mature North American market (52%) balanced by high-growth APAC region (+89% YoY)[1]. Regulatory approvals in 8 new countries and strong traction in Singapore, Japan, and Australia markets validate international expansion strategy.",
      stage: 1,
      type: "insight",
      author: "emily.wong@consulting.com",
      created_at: "2024-11-02T13:15:00Z",
    },
  ];

  // ===== STAGE 2: Synthesis Insights (4 total - citing BOTH Stage 1 AND Stage 0) =====
  const stage2: Array<{
    chunk_id: string;
    text: string;
    stage: number;
    type: string;
    author?: string;
    created_at?: string;
    source_title?: string;
  }> = [
    {
      chunk_id: "ins_strategic_analysis_chunk_1",
      text: 'The convergence of strong market adoption (78%)[1] and improving customer satisfaction (32% increase)[2] suggests sustainable competitive positioning. However, direct competitor analysis[3] indicates vulnerability to specialized entrants in the 27% "emerging player" segment, particularly if they solve the integration challenge that drives current satisfaction.',
      stage: 2,
      type: "insight",
      author: "elena.popov@consulting.com",
      created_at: "2024-11-03T13:30:00Z",
    },
    {
      chunk_id: "ins_growth_opportunity_chunk_2",
      text: "The 18% CAGR industry forecast[1] combined with demonstrated financial performance (24% revenue growth)[2] and strong customer retention[3] creates a favorable growth environment. Geographic expansion showing 89% growth in APAC[4] indicates successful international scaling capabilities.",
      stage: 2,
      type: "insight",
      author: "david.kim@consulting.com",
      created_at: "2024-11-03T15:00:00Z",
    },
    {
      chunk_id: "ins_product_market_fit_chunk_3",
      text: "Product engagement patterns reveal strong value realization, with 42% DAU growth[1] and 41% upsell rates[2]. Cloud migration trends (67% adoption)[3] align with our platform architecture, while enterprise security requirements[4] match our SOC 2 Type II and ISO 27001 certifications.",
      stage: 2,
      type: "insight",
      author: "lisa.thompson@consulting.com",
      created_at: "2024-11-04T10:20:00Z",
    },
    {
      chunk_id: "ins_competitive_moat_chunk_4",
      text: "Competitive positioning shows defensible advantages: integration capabilities drive 89% satisfaction scores[1], pricing power evidenced by 18% ACV increase[2], and enterprise credibility from security certifications[3]. The 45% market share leader position[4] provides scale advantages in R&D and sales efficiency.",
      stage: 2,
      type: "insight",
      author: "alex.martinez@consulting.com",
      created_at: "2024-11-04T14:45:00Z",
    },
  ];

  // Insert all chunks
  const insertStmt = db.prepare(`
    INSERT INTO content (chunk_id, text, stage, type, author, created_at, source_title, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const allChunks = [...stage0, ...stage1, ...stage2];
  allChunks.forEach((chunk) => {
    insertStmt.run(
      chunk.chunk_id,
      chunk.text,
      chunk.stage,
      chunk.type,
      chunk.author ?? null,
      chunk.created_at ?? null,
      chunk.source_title ?? null,
      "published"
    );
  });

  console.log("✅ Inserted chunks:", {
    "Stage 0 (raw)": stage0.length,
    "Stage 1 (insights)": stage1.length,
    "Stage 2 (synthesis)": stage2.length,
    Total: stage0.length + stage1.length + stage2.length,
  });

  // ===== CITATIONS =====
  const citations = [
    // Stage 1 → Stage 0 (each Stage 1 insight cites one Stage 0 raw data)
    {
      source: "ins_market_trends_chunk_1",
      target: "raw_market_survey_chunk_1",
      marker: "[1]",
    },
    {
      source: "ins_competitive_position_chunk_2",
      target: "raw_competitor_report_chunk_2",
      marker: "[1]",
    },
    {
      source: "ins_customer_sentiment_chunk_3",
      target: "raw_customer_feedback_chunk_3",
      marker: "[1]",
    },
    {
      source: "ins_financial_performance_chunk_4",
      target: "raw_financial_data_chunk_5",
      marker: "[1]",
    },
    {
      source: "ins_cloud_migration_chunk_5",
      target: "raw_tech_trends_chunk_6",
      marker: "[1]",
    },
    {
      source: "ins_pricing_strategy_chunk_6",
      target: "raw_pricing_analysis_chunk_7",
      marker: "[1]",
    },
    {
      source: "ins_product_engagement_chunk_7",
      target: "raw_user_engagement_chunk_9",
      marker: "[1]",
    },
    {
      source: "ins_geographic_expansion_chunk_8",
      target: "raw_market_expansion_chunk_10",
      marker: "[1]",
    },

    // Stage 2 → Mixed (Stage 1 insights + Stage 0 raw data)

    // ins_strategic_analysis_chunk_1 cites: 2 Stage 1 + 1 Stage 0
    {
      source: "ins_strategic_analysis_chunk_1",
      target: "ins_market_trends_chunk_1",
      marker: "[1]",
    },
    {
      source: "ins_strategic_analysis_chunk_1",
      target: "ins_customer_sentiment_chunk_3",
      marker: "[2]",
    },
    {
      source: "ins_strategic_analysis_chunk_1",
      target: "raw_competitor_report_chunk_2",
      marker: "[3]",
    },

    // ins_growth_opportunity_chunk_2 cites: 2 Stage 1 + 2 Stage 0
    {
      source: "ins_growth_opportunity_chunk_2",
      target: "raw_industry_analysis_chunk_4",
      marker: "[1]",
    },
    {
      source: "ins_growth_opportunity_chunk_2",
      target: "ins_financial_performance_chunk_4",
      marker: "[2]",
    },
    {
      source: "ins_growth_opportunity_chunk_2",
      target: "ins_customer_sentiment_chunk_3",
      marker: "[3]",
    },
    {
      source: "ins_growth_opportunity_chunk_2",
      target: "ins_geographic_expansion_chunk_8",
      marker: "[4]",
    },

    // ins_product_market_fit_chunk_3 cites: 2 Stage 1 + 2 Stage 0
    {
      source: "ins_product_market_fit_chunk_3",
      target: "ins_product_engagement_chunk_7",
      marker: "[1]",
    },
    {
      source: "ins_product_market_fit_chunk_3",
      target: "ins_pricing_strategy_chunk_6",
      marker: "[2]",
    },
    {
      source: "ins_product_market_fit_chunk_3",
      target: "raw_tech_trends_chunk_6",
      marker: "[3]",
    },
    {
      source: "ins_product_market_fit_chunk_3",
      target: "raw_security_compliance_chunk_8",
      marker: "[4]",
    },

    // ins_competitive_moat_chunk_4 cites: 1 Stage 1 + 3 Stage 0
    {
      source: "ins_competitive_moat_chunk_4",
      target: "ins_customer_sentiment_chunk_3",
      marker: "[1]",
    },
    {
      source: "ins_competitive_moat_chunk_4",
      target: "raw_pricing_analysis_chunk_7",
      marker: "[2]",
    },
    {
      source: "ins_competitive_moat_chunk_4",
      target: "raw_security_compliance_chunk_8",
      marker: "[3]",
    },
    {
      source: "ins_competitive_moat_chunk_4",
      target: "raw_competitor_report_chunk_2",
      marker: "[4]",
    },
  ];

  const citationStmt = db.prepare(`
    INSERT INTO citations (source_chunk_id, target_chunk_id, citation_marker, relationship_type)
    VALUES (?, ?, ?, 'cites')
  `);

  citations.forEach(({ source, target, marker }) => {
    citationStmt.run(source, target, marker);
  });

  console.log(`✅ Inserted ${citations.length} citation edges`);
  console.log("🎉 Database seeded successfully!");
}

export { seed };

// Run seed when executed as a script
seed();
