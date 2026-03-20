import Foundation

/// Model routing strategy for Scythe.
///
/// Privacy boundary: raw financial data (transactions, PAN, PII) → local vLLM only.
/// Aggregated/anonymized data → OpenRouter for best model selection.
enum ScytheModelRouter {

    /// Fast, cheap model for simple text generation (alert explanations, short summaries).
    static let fast = "anthropic/claude-haiku-4-5-20251001"

    /// Balanced model for conversational interactions and moderate reasoning.
    static let balanced = "anthropic/claude-sonnet-4-6"

    /// Most capable model for complex financial analysis (autopsy deep-dives, anomaly detection).
    static let capable = "anthropic/claude-opus-4-6"

    /// Cost-optimized: routes to the cheapest model that meets quality threshold.
    static let costOptimized = "openrouter/auto"

    /// Select the appropriate model for a given task.
    static func modelFor(task: ScytheTask) -> String {
        switch task {
        case .alertExplanation:
            return fast
        case .autopsyNarrative:
            return balanced
        case .conversationalChat:
            return balanced
        case .deepAnalysis:
            return capable
        case .costSensitive:
            return costOptimized
        }
    }

    enum ScytheTask {
        /// Short, single-sentence alert explanations
        case alertExplanation
        /// Financial Autopsy narrative generation
        case autopsyNarrative
        /// User-facing chat about subscriptions
        case conversationalChat
        /// Complex financial pattern analysis
        case deepAnalysis
        /// Bulk operations where cost matters most
        case costSensitive
    }
}
