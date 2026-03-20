import Foundation

/// OpenClaw pipeline definitions for Scythe's five intelligence engines.
///
/// Architecture:
///   OpenClaw Main Session (orchestrator) → spawns sub-agents per pipeline
///   Each pipeline runs as an autonomous agent with its own cron schedule.
///   Raw financial data stays within the VPC — OpenClaw routes to local vLLM.
///
/// The iOS app doesn't run OpenClaw directly — it reads pipeline results
/// via the Scythe backend API. These definitions mirror the server-side
/// `openclaw.json` pipeline config for type safety and status tracking.

// MARK: - Pipeline Definitions

enum ScythePipeline: String, CaseIterable, Codable {
    case subscriptionResolver = "subscription_resolver"
    case priceHikeMonitor = "price_hike_monitor"
    case trialSentinel = "trial_sentinel"
    case savingsOptimizer = "savings_optimizer"
    case rewardsArbitrage = "rewards_arbitrage"

    var displayName: String {
        switch self {
        case .subscriptionResolver: return "Subscription Resolver"
        case .priceHikeMonitor: return "Price Hike Monitor"
        case .trialSentinel: return "Trial Sentinel"
        case .savingsOptimizer: return "Savings Optimizer"
        case .rewardsArbitrage: return "Rewards Arbitrage"
        }
    }

    var description: String {
        switch self {
        case .subscriptionResolver:
            return "Resolves Plaid descriptors + Gmail receipts into clean merchant profiles"
        case .priceHikeMonitor:
            return "Detects price_history deltas and flags silent price increases"
        case .trialSentinel:
            return "Parses Gmail trial confirmations and manages countdown to conversion"
        case .savingsOptimizer:
            return "Compares monthly vs annual cadence, finds switch-and-save opportunities"
        case .rewardsArbitrage:
            return "Cross-references card rewards rates against merchant categories"
        }
    }

    var icon: String {
        switch self {
        case .subscriptionResolver: return "magnifyingglass.circle"
        case .priceHikeMonitor: return "arrow.up.right.circle"
        case .trialSentinel: return "shield.checkered"
        case .savingsOptimizer: return "calendar.badge.checkmark"
        case .rewardsArbitrage: return "gift.circle"
        }
    }

    /// Cron schedule matching the OpenClaw server config.
    var cronSchedule: String {
        switch self {
        case .subscriptionResolver: return "0 */6 * * *"   // Every 6 hours
        case .priceHikeMonitor: return "0 0 * * *"          // Daily at midnight
        case .trialSentinel: return "0 */1 * * *"           // Every hour
        case .savingsOptimizer: return "0 0 * * 1"          // Weekly on Monday
        case .rewardsArbitrage: return "0 0 1 * *"          // Monthly on the 1st
        }
    }

    /// Which data sources this pipeline reads.
    var dataSources: [PipelineDataSource] {
        switch self {
        case .subscriptionResolver: return [.plaidTransactions, .gmailReceipts]
        case .priceHikeMonitor: return [.plaidTransactions, .priceHistory]
        case .trialSentinel: return [.gmailReceipts]
        case .savingsOptimizer: return [.plaidTransactions, .gmailReceipts]
        case .rewardsArbitrage: return [.plaidCardMetadata, .merchantCategories]
        }
    }

    /// Whether this pipeline touches raw PII (must route to local vLLM, not OpenRouter).
    var requiresLocalInference: Bool {
        switch self {
        case .subscriptionResolver: return true   // Raw transaction descriptors
        case .priceHikeMonitor: return true        // Transaction amounts
        case .trialSentinel: return true           // Email content
        case .savingsOptimizer: return true         // Transaction + email data
        case .rewardsArbitrage: return false        // Aggregated category data only
        }
    }
}

enum PipelineDataSource: String, Codable {
    case plaidTransactions = "plaid_transactions"
    case plaidCardMetadata = "plaid_card_metadata"
    case gmailReceipts = "gmail_receipts"
    case priceHistory = "price_history"
    case merchantCategories = "merchant_categories"
}

// MARK: - Pipeline Status (read from backend)

struct PipelineStatus: Identifiable, Codable {
    let id: UUID
    let pipeline: ScythePipeline
    var state: PipelineState
    var lastRunAt: Date?
    var nextRunAt: Date?
    var lastResult: PipelineResult?
    var itemsProcessed: Int
    var alertsGenerated: Int

    enum PipelineState: String, Codable {
        case idle = "IDLE"
        case running = "RUNNING"
        case completed = "COMPLETED"
        case failed = "FAILED"
    }

    struct PipelineResult: Codable {
        let summary: String
        let newAlerts: Int
        let processingTimeMs: Int
        let modelUsed: String  // e.g. "phi-4-14b" (local) or OpenRouter model ID
    }
}

// MARK: - OpenClaw Gateway Config (mirrors server-side openclaw.json)

/// This struct mirrors the server-side `openclaw.json` for reference.
/// The iOS app uses it to understand pipeline routing, not to configure OpenClaw directly.
struct OpenClawGatewayConfig: Codable {
    let orchestrator: OrchestratorConfig
    let pipelines: [PipelineConfig]
    let modelRouting: ModelRoutingConfig

    struct OrchestratorConfig: Codable {
        let model: String                    // "anthropic/claude-opus-4-6" via OpenRouter
        let role: String                     // "orchestrate" — never executes, only delegates
        let maxConcurrentAgents: Int         // 5 — one per pipeline
    }

    struct PipelineConfig: Codable {
        let name: String
        let agentModel: String               // Local vLLM or OpenRouter model
        let cronSchedule: String
        let dataSources: [String]
        let outputTarget: String             // "scythe_api" — results POST'd to backend
        let requiresLocalInference: Bool
    }

    struct ModelRoutingConfig: Codable {
        let localEndpoint: String            // "http://vllm.internal:8000/v1"
        let localModel: String               // "phi-4-14b-fp8"
        let cloudGateway: String             // "https://openrouter.ai/api/v1"
        let cloudFallbackModel: String       // "anthropic/claude-haiku-4-5-20251001"
        let privacyBoundary: String          // "local_only_for_pii"
    }

    /// Reference configuration matching the Scythe blueprint.
    static let reference = OpenClawGatewayConfig(
        orchestrator: OrchestratorConfig(
            model: "anthropic/claude-opus-4-6",
            role: "orchestrate",
            maxConcurrentAgents: 5
        ),
        pipelines: ScythePipeline.allCases.map { pipeline in
            PipelineConfig(
                name: pipeline.rawValue,
                agentModel: pipeline.requiresLocalInference ? "phi-4-14b-fp8" : "anthropic/claude-haiku-4-5-20251001",
                cronSchedule: pipeline.cronSchedule,
                dataSources: pipeline.dataSources.map(\.rawValue),
                outputTarget: "scythe_api",
                requiresLocalInference: pipeline.requiresLocalInference
            )
        },
        modelRouting: ModelRoutingConfig(
            localEndpoint: "http://vllm.internal:8000/v1",
            localModel: "phi-4-14b-fp8",
            cloudGateway: "https://openrouter.ai/api/v1",
            cloudFallbackModel: "anthropic/claude-haiku-4-5-20251001",
            privacyBoundary: "local_only_for_pii"
        )
    )
}
