import { calculatorTool } from "./calculator";
import { webSearchTool } from "./webSearch";
import { weatherTool } from "./weather";
import { wikipediaTool } from "./wikipedia";
import { urlReaderTool } from "./urlReader";
import type { Tool } from "ai";

export const ALL_TOOLS = {
  calculator: calculatorTool,
  web_search: webSearchTool,
  weather: weatherTool,
  wikipedia: wikipediaTool,
  url_reader: urlReaderTool,
} as Record<string, Tool>;

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
    description:
      "Evaluate math expressions, algebra, trigonometry, unit conversions",
    icon: "calculator",
  },
  {
    id: "web_search",
    name: "Web Search",
    description:
      "Search the web for current news and information (requires Tavily API key)",
    icon: "search",
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
    description:
      "Search Wikipedia for facts, history, science, and definitions",
    icon: "book-open",
  },
  {
    id: "url_reader",
    name: "URL Reader",
    description: "Fetch and read the text content of any public webpage",
    icon: "link",
  },
];
