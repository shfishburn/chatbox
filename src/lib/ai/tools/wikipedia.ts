import { z } from "zod";
import { tool } from "./tool";

export const wikipediaTool = tool({
  description:
    "Search Wikipedia and retrieve a summary of a topic. Great for factual questions, biographies, history, science, and definitions.",
  parameters: z.object({
    query: z.string().describe("Topic or search term to look up on Wikipedia"),
  }),
  execute: async ({ query }) => {
    try {
      // Search for the best matching article
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) throw new Error("Wikipedia search failed");

      const searchData = await searchRes.json();
      const results = searchData.query?.search ?? [];
      if (!results.length) {
        return { error: `No Wikipedia article found for "${query}".` };
      }

      const title = results[0].title;

      // Fetch summary from the REST API
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const summaryRes = await fetch(summaryUrl);
      if (!summaryRes.ok) throw new Error("Could not fetch article summary");

      const article = await summaryRes.json();
      return {
        title: article.title,
        summary: article.extract,
        url:
          article.content_urls?.desktop?.page ??
          `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        thumbnail: article.thumbnail?.source ?? null,
      };
    } catch (err) {
      return { error: `Wikipedia lookup failed: ${(err as Error).message}` };
    }
  },
});
