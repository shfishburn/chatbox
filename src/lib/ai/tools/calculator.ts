import { tool } from "ai";
import { z } from "zod";
import { evaluate } from "mathjs";

export const calculatorTool = tool({
  description:
    "Evaluate a mathematical expression. Supports arithmetic, algebra, trigonometry, statistics, unit conversions, and more. Use this whenever the user needs a calculation.",
  parameters: z.object({
    expression: z
      .string()
      .describe(
        "A math expression to evaluate, e.g. '2 * (3 + 4)', 'sqrt(144)', 'sin(pi/2)', '5 km to m'",
      ),
  }),
  execute: async ({ expression }) => {
    try {
      // mathjs.evaluate is sandboxed — it does NOT execute arbitrary JS
      const result = evaluate(expression);
      return { result: String(result), expression };
    } catch (err) {
      return {
        error: `Could not evaluate expression: ${(err as Error).message}`,
        expression,
      };
    }
  },
});
