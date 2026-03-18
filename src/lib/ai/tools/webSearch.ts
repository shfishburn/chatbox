import { tool } from "./tool";
import { z } from "zod";

export const webSearchTool = tool({
  description:
    "Search the web for current information, news, facts, or any topic. Returns relevant search results with titles, URLs, and summaries.",
  parameters: z.object({
    query: z.string().describe("The search query"),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum number of results to return (1-10)"),
  }),
  execute: async ({ query, maxResults = 5 }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      return {
        error: "Web search is not configured (missing TAVILY_API_KEY).",
      };
    }

    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: Math.min(maxResults, 10),
          search_depth: "basic",
          include_answer: true,
        }),
      });

      if (!res.ok) {
        return { error: `Search API error: ${res.status}` };
      }

      const data = await res.json();
      return {
        answer: data.answer ?? null,
        results: (data.results ?? []).map(
          (r: {
            title: string;
            url: string;
            content: string;
            score: number;
          }) => ({
            title: r.title,
            url: r.url,
            snippet: r.content,
            score: r.score,
          }),
        ),
      };
    } catch (err) {
      return { error: `Search failed: ${(err as Error).message}` };
    }
  },
});
