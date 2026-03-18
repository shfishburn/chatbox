import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ChatCompletionTool } from "../openrouter";
import { calculatorTool } from "./calculator";
import type { Tool } from "./tool";
import { urlReaderTool } from "./urlReader";
import { weatherTool } from "./weather";
import { wikipediaTool } from "./wikipedia";

export type { Tool };

type ToolSchemaLike = {
  description: string;
  parameters: z.ZodTypeAny;
};

export const ALL_TOOLS = {
  calculator: calculatorTool,
  weather: weatherTool,
  wikipedia: wikipediaTool,
  url_reader: urlReaderTool,
};

export type AnyTool = (typeof ALL_TOOLS)[keyof typeof ALL_TOOLS];

export function toOpenAITools(tools: Record<string, ToolSchemaLike>): ChatCompletionTool[] {
  return Object.entries(tools).map(([name, t]) => {
    const { $schema, ...parameters } = zodToJsonSchema(t.parameters) as {
      $schema?: string;
      [key: string]: unknown;
    };
    void $schema;
    return {
      type: "function" as const,
      function: { name, description: t.description, parameters },
    };
  });
}

export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const TOOL_META: ToolMeta[] = [
  {
    id: "calculator",
    name: "Calculator",
    description: "Evaluate math expressions, algebra, trigonometry, unit conversions",
    icon: "calculator",
  },
  {
    id: "weather",
    name: "Weather",
    description: "Get current weather and forecasts for any city",
    icon: "cloud",
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    description: "Search Wikipedia for facts, history, science, and definitions",
    icon: "book-open",
  },
  {
    id: "url_reader",
    name: "URL Reader",
    description: "Fetch and read the text content of any public webpage",
    icon: "link",
  },
];
