"use client";

import {
  ArrowRight,
  BookOpen,
  Bot,
  BrainCircuit,
  Calculator,
  Cloud,
  Link as LinkIcon,
  MessageSquare,
  ToggleRight,
  Wrench,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const tools = [
  {
    icon: <Calculator className="w-6 h-6" />,
    name: "Calculator",
    description:
      "Evaluate math expressions, algebra, trigonometry, and unit conversions. When enabled, the AI can compute exact answers instead of guessing.",
    example: '"What is 2^10 × 3.14?" → 3215.36',
    color: "blue",
  },
  {
    icon: <Cloud className="w-6 h-6" />,
    name: "Weather",
    description:
      "Fetch real-time weather and 3-day forecasts for any city using the Open-Meteo API. Without this tool, the AI can only offer generic advice.",
    example: '"What\'s the weather in Tokyo?" → 18°C, Partly cloudy',
    color: "sky",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    name: "Wikipedia",
    description:
      "Search and summarize Wikipedia articles for factual, up-to-date information. Without it, the AI relies solely on its training data.",
    example: '"Tell me about the James Webb Space Telescope" → Full summary with source link',
    color: "amber",
  },
  {
    icon: <LinkIcon className="w-6 h-6" />,
    name: "URL Reader",
    description:
      "Fetch and extract the text content of any public webpage. Lets the AI read articles, documentation, or any URL you share.",
    example: '"Summarize this article: https://..." → Extracted text summary',
    color: "emerald",
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800/50",
    text: "text-blue-700 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
  },
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-800/50",
    text: "text-sky-700 dark:text-sky-400",
    iconBg: "bg-sky-100 dark:bg-sky-900/50",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800/50",
    text: "text-amber-700 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800/50",
    text: "text-emerald-700 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold">ChatBox</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#tools" className="hover:text-foreground transition-colors">
              Tools
            </a>
            <a href="#stack" className="hover:text-foreground transition-colors">
              Stack
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 text-sm font-medium">
          <Wrench className="w-3.5 h-3.5" />
          Proof of Concept — Tool Calling Exploration
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-tight">
          See how <span className="text-blue-600 dark:text-blue-400">tools</span> change what AI can
          do
        </h1>

        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          ChatBox lets you chat with multiple LLMs and{" "}
          <strong className="text-foreground">toggle tools on and off per conversation</strong> — so
          you can directly observe how access to a calculator, weather API, Wikipedia, or URL reader
          changes the quality and accuracy of AI responses.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-base"
          >
            Try it out
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-base"
          >
            How it works
          </a>
        </div>
      </section>

      {/* What is tool calling */}
      <section
        id="how-it-works"
        className="bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800"
      >
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">What is tool calling?</h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-2xl mx-auto mb-12 leading-relaxed">
            Large language models generate text, but they can&apos;t natively perform calculations,
            look up live data, or browse the web.{" "}
            <strong className="text-foreground">Tool calling</strong> lets an AI model request that
            an external function be run on its behalf — then use the result in its response.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center p-6 rounded-2xl bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">1. You ask a question</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                &quot;What&apos;s 15% tip on $84.50?&quot;
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mx-auto mb-4">
                <BrainCircuit className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold mb-2">2. AI calls a tool</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Model requests:{" "}
                <code className="text-xs bg-neutral-100 dark:bg-neutral-700 px-1 py-0.5 rounded">
                  calculator(&quot;84.50 * 0.15&quot;)
                </code>
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-white dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold mb-2">3. You get a precise answer</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                &quot;A 15% tip on $84.50 is <strong>$12.68</strong>.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The experiment */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            The experiment: toggle tools, compare results
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Each conversation has a <strong className="text-foreground">tools panel</strong> where
            you enable or disable individual tools. Ask the same question with different tool
            configurations — or different models — and see how the answers change.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-800/50">
                <ToggleRight className="w-3.5 h-3.5" />
                Tools OFF
              </div>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
              &quot;What&apos;s the weather in Paris right now?&quot;
            </p>
            <div className="text-sm bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-3 border border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-600 dark:text-neutral-400">
                &quot;I don&apos;t have access to real-time weather data. As of my last training
                data, Paris typically experiences…&quot;
              </span>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-200 dark:border-blue-800/50">
                <ToggleRight className="w-3.5 h-3.5" />
                Weather ON
              </div>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
              &quot;What&apos;s the weather in Paris right now?&quot;
            </p>
            <div className="text-sm bg-white dark:bg-neutral-800/50 rounded-lg p-3 border border-blue-100 dark:border-blue-800/30">
              <span className="text-foreground">
                &quot;It&apos;s currently <strong>12°C</strong> and partly cloudy in Paris with
                winds at 15 km/h. The next 3 days…&quot;
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Available tools */}
      <section
        id="tools"
        className="bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800"
      >
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Available tools</h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-xl mx-auto mb-10">
            Four tools are available to toggle per session. Each gives the AI a different real-world
            capability.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {tools.map((t) => {
              const c = colorMap[t.color];
              return (
                <div key={t.name} className={cn("p-5 rounded-2xl border", c.bg, c.border)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        c.iconBg,
                        c.text,
                      )}
                    >
                      {t.icon}
                    </div>
                    <h3 className="font-semibold text-lg">{t.name}</h3>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed">
                    {t.description}
                  </p>
                  <div className="text-xs font-mono bg-white/60 dark:bg-black/20 rounded-lg px-3 py-2 text-neutral-500 dark:text-neutral-400">
                    {t.example}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Models + how it's built */}
      <section id="stack" className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Multi-model support</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
              Switch between models per conversation to compare how different LLMs handle tool
              calling. Supported models include:
            </p>
            <ul className="space-y-2 text-sm">
              {[
                "GPT-5 Nano & GPT-4.1 Nano",
                "Gemini 2.5 Flash Lite",
                "Qwen 3 & Qwen 3.5",
                "Llama 3.1 8B & Llama 3.3 70B",
              ].map((m) => (
                <li
                  key={m}
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {m}
                </li>
              ))}
            </ul>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-4">
              Powered by OpenRouter — bring your own API key.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">How it&apos;s built</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
              ChatBox is open source and built with a modern stack:
            </p>
            <ul className="space-y-2 text-sm">
              {[
                "Next.js 15 with the App Router",
                "TypeScript end to end",
                "Supabase for auth & database (with RLS)",
                "OpenRouter as a unified LLM gateway",
                "Server-side tool execution for security",
                "Zod schemas for type-safe tool parameters",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-neutral-600 dark:text-neutral-400"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-neutral-950">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to see the difference tools make?
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-10 max-w-lg mx-auto leading-relaxed">
            Create an account, bring your OpenRouter API key, and start experimenting with
            tool-augmented AI conversations.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-base"
            >
              Start chatting
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-base"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-semibold">ChatBox</span>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                A proof of concept exploring how tool calling changes AI conversations.
              </p>
            </div>
            <div className="flex gap-8 text-sm">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Product</span>
                <a
                  href="#how-it-works"
                  className="text-neutral-500 dark:text-neutral-400 hover:text-foreground transition-colors"
                >
                  How it works
                </a>
                <a
                  href="#tools"
                  className="text-neutral-500 dark:text-neutral-400 hover:text-foreground transition-colors"
                >
                  Tools
                </a>
                <a
                  href="#stack"
                  className="text-neutral-500 dark:text-neutral-400 hover:text-foreground transition-colors"
                >
                  Stack
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Account</span>
                <Link
                  href="/login"
                  className="text-neutral-500 dark:text-neutral-400 hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-neutral-500 dark:text-neutral-400 hover:text-foreground transition-colors"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500">
            Built with Next.js, Supabase & OpenRouter
          </div>
        </div>
      </footer>
    </div>
  );
}
