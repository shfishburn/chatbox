import type { z } from "zod";

type BivariantAsyncFn<T> = {
  bivarianceHack: (args: T) => Promise<unknown>;
}["bivarianceHack"];

export interface Tool<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  description: string;
  parameters: TSchema;
  execute: BivariantAsyncFn<z.infer<TSchema>>;
}

export function tool<TSchema extends z.ZodTypeAny>(config: Tool<TSchema>): Tool<TSchema> {
  return config;
}
