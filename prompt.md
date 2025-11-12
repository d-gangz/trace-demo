I'm trying to create a prototype to illustrate this insight with citation lineage kinds of concept.

Because I'm working with a consulting firm, and they want to build an AI-powered research tool. And now the main concern is the confidence in insights — how data flows, transforms, and cites sources.

So I want to build a demo showing that lineage end-to-end for an insights report. so like in the insights report, there are citations then user view the citation lineage for each citation too.

**IMPORTANT** first read all the documents inside /references folder to gain more context.

Requirements:

1. An insight report that is a markdown doc. this insight report also contains citations
2. some sample raw sources and also other insights that is referenced in the sample report. It's important to have a combination of raw sources and also insets because these insets are previously synthesized from other raw sources.
3. create sample sqlite databases to stores these synthetic information. I was thinking maybe:

- one for the citations only which would enable us to use recursive CTE to construct the full lineage of that cited source (only cited insights would have lineage).
- one for the content which is to store the chunks (can be raw data information or insights)
- note that the content and citations, they are related by the chunkId first, we assume that we are storing text chunks in the content table.

4. Maybe for the final frontend, we can showcase the inside report as a Markdown. If it's visualized nicely, we can use React Markdown to showcase it. We also showcase the inline citations for that inside report. Upon hovering over the inline citation, it might show the immediate source that was quoted from it. And then, inside there is a button that says "View Full". When you click it, you'll have a side sheet that showcases the full lineart which is constructed from the citation table.
5. Utilise the `skill-agent` to invoke the `shadcn` skill to understand how to use the shadcn to build out our frontend.

First discuss with me to clarify the requirements. Then finally to draft the final implementation plan for a junior engineer (who doesnt know this codebase) to execute it.
