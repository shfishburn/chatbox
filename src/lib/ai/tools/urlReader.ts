import { tool } from "./tool";
import { z } from "zod";

// Allowed external URL check — blocks private IP ranges and localhost (SSRF protection per OWASP)
function isBlockedUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();

  const blockedPatterns = [
    /^localhost$/,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^0\.0\.0\.0$/,
    /^::1$/,
    /^fc00:/,
    /^fd[0-9a-f]{2}:/,
    /^169\.254\./, // link-local
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT
    /\.internal$/,
    /\.local$/,
  ];

  return blockedPatterns.some((p) => p.test(hostname));
}

export const urlReaderTool = tool({
  description:
    "Fetch and read the text content of a public webpage URL. Useful for summarizing articles, extracting information from websites, or reading documentation.",
  parameters: z.object({
    url: z
      .string()
      .url()
      .describe(
        "The full URL of the page to read, e.g. 'https://example.com/article'",
      ),
  }),
  execute: async ({ url }) => {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return { error: "Invalid URL provided." };
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return { error: "Only http and https URLs are allowed." };
    }

    // SSRF protection: block private/internal addresses
    if (isBlockedUrl(parsedUrl)) {
      return { error: "Access to private or internal URLs is not allowed." };
    }

    try {
      const res = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent": "ChatBox-Bot/1.0 (AI assistant; web reader)",
          Accept: "text/html,text/plain",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        return { error: `HTTP ${res.status}: ${res.statusText}` };
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (
        !contentType.includes("text/") &&
        !contentType.includes("application/json")
      ) {
        return { error: "URL does not return readable text content." };
      }

      const text = await res.text();

      // Strip HTML tags for cleaner content
      const stripped = text
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/\s{3,}/g, "\n\n")
        .trim();

      // Limit to ~8000 chars to stay within context budget
      const truncated =
        stripped.length > 8000
          ? stripped.slice(0, 8000) + "\n\n[Content truncated]"
          : stripped;

      return { url: parsedUrl.toString(), content: truncated };
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes("timed out")) {
        return { error: "Request timed out after 10 seconds." };
      }
      return { error: `Failed to fetch URL: ${message}` };
    }
  },
});
