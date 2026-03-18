export type TextPart = { type: "text"; text: string };

export type ToolCallPart = {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: unknown;
};

export type ToolResultPart = {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  result: unknown;
};

export type CoreMessage =
  | { role: "user"; content: string | TextPart[] }
  | { role: "assistant"; content: string | (TextPart | ToolCallPart)[] }
  | { role: "tool"; content: ToolResultPart[] }
  | { role: "system"; content: string };

export type ToolInvocation =
  | { state: "call"; toolCallId: string; toolName: string; args: unknown }
  | {
      state: "result";
      toolCallId: string;
      toolName: string;
      args: unknown;
      result: unknown;
    };

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolInvocations?: ToolInvocation[];
}
