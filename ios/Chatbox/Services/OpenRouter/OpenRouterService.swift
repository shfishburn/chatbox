import Foundation

/// OpenRouter LLM gateway — unified access to 500+ models via one OpenAI-compatible endpoint.
/// Used for client-side inference needs where raw financial data is NOT involved:
/// - Financial Autopsy narrative generation (aggregated/anonymized data)
/// - Natural language explanations of alerts and savings
/// - User-facing chat interactions
///
/// For raw transaction/PII processing, requests route to local vLLM via OpenClaw pipelines.
actor OpenRouterService {
    static let shared = OpenRouterService()

    private let baseURL = URL(string: "https://openrouter.ai/api/v1")!
    private var apiKey: String?

    // Default to a capable, cost-effective model — can be overridden per-request
    private let defaultModel = "anthropic/claude-sonnet-4-6"

    struct Config {
        var apiKey: String
        var defaultModel: String?
        var appName: String = "Scythe"
        var appURL: String = "https://scythe.app"
    }

    func configure(_ config: Config) {
        self.apiKey = config.apiKey
    }

    // MARK: - Chat Completions

    func chatCompletion(
        messages: [ChatMessage],
        model: String? = nil,
        temperature: Double = 0.7,
        maxTokens: Int? = nil
    ) async throws -> ChatResponse {
        var body: [String: Any] = [
            "model": model ?? defaultModel,
            "messages": messages.map { $0.toDictionary() },
            "temperature": temperature
        ]
        if let maxTokens {
            body["max_tokens"] = maxTokens
        }

        return try await request("POST", path: "/chat/completions", body: body)
    }

    /// Streaming chat completion — returns an AsyncStream of delta tokens.
    func chatCompletionStream(
        messages: [ChatMessage],
        model: String? = nil,
        temperature: Double = 0.7
    ) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    let body: [String: Any] = [
                        "model": model ?? defaultModel,
                        "messages": messages.map { $0.toDictionary() },
                        "temperature": temperature,
                        "stream": true
                    ]

                    var urlRequest = URLRequest(url: baseURL.appendingPathComponent("/chat/completions"))
                    urlRequest.httpMethod = "POST"
                    urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    urlRequest.setValue("Bearer \(apiKey ?? "")", forHTTPHeaderField: "Authorization")
                    urlRequest.setValue("Scythe", forHTTPHeaderField: "X-Title")
                    urlRequest.httpBody = try JSONSerialization.data(withJSONObject: body)

                    let (stream, response) = try await URLSession.shared.bytes(for: urlRequest)

                    guard let httpResponse = response as? HTTPURLResponse,
                          (200...299).contains(httpResponse.statusCode) else {
                        throw OpenRouterError.httpError(statusCode: (response as? HTTPURLResponse)?.statusCode ?? 0)
                    }

                    for try await line in stream.lines {
                        guard line.hasPrefix("data: ") else { continue }
                        let payload = String(line.dropFirst(6))
                        if payload == "[DONE]" { break }

                        guard let data = payload.data(using: .utf8),
                              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                              let choices = json["choices"] as? [[String: Any]],
                              let delta = choices.first?["delta"] as? [String: Any],
                              let content = delta["content"] as? String else {
                            continue
                        }
                        continuation.yield(content)
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    // MARK: - Scythe-Specific Convenience Methods

    /// Generate the Financial Autopsy narrative from aggregated (non-PII) data.
    func generateAutopsyNarrative(autopsy: FinancialAutopsy) async throws -> String {
        let messages: [ChatMessage] = [
            .system("""
                You are Scythe, a financial intelligence agent. Generate a concise, \
                hard-hitting summary of the user's financial waste over the past 24 months. \
                Be direct. Use specific dollar amounts. No fluff.
                """),
            .user("""
                Forgotten subscriptions: \(autopsy.formatted(autopsy.forgottenSubscriptionsYearly))/yr
                Price hikes absorbed: \(autopsy.formatted(autopsy.priceHikesAbsorbedYearly))/yr
                Trials that converted: \(autopsy.formatted(autopsy.trialsConvertedYearly))/yr
                Rewards left on table: \(autopsy.formatted(autopsy.rewardsLeftOnTableYearly))/yr
                Total recoverable: \(autopsy.formatted(autopsy.totalRecoverableYearly))/yr
                """)
        ]

        let response = try await chatCompletion(
            messages: messages,
            model: "anthropic/claude-haiku-4-5-20251001", // Fast + cheap for narrative
            temperature: 0.8,
            maxTokens: 300
        )
        return response.content
    }

    /// Generate a human-readable explanation for an alert.
    func explainAlert(_ alert: ScytheAlert) async throws -> String {
        let messages: [ChatMessage] = [
            .system("You are Scythe. Explain this financial alert in 1-2 sentences. Be direct and actionable."),
            .user("Alert type: \(alert.alertType.rawValue)\nMerchant: \(alert.merchantName)\nHeadline: \(alert.headline)\nDetail: \(alert.detail)")
        ]

        let response = try await chatCompletion(
            messages: messages,
            model: "anthropic/claude-haiku-4-5-20251001",
            temperature: 0.5,
            maxTokens: 150
        )
        return response.content
    }

    /// Conversational follow-up — user asks questions about their subscriptions.
    func chat(
        userMessage: String,
        context: [ChatMessage],
        subscriptionSummary: String
    ) async throws -> String {
        var messages: [ChatMessage] = [
            .system("""
                You are Scythe, a financial intelligence agent that helps users manage subscriptions. \
                You have access to the user's subscription data. Be concise and actionable. \
                If the user wants to cancel something, tell them you can kill the virtual card. \
                Never reveal raw card numbers or tokens.

                Current subscription summary:
                \(subscriptionSummary)
                """)
        ]
        messages.append(contentsOf: context)
        messages.append(.user(userMessage))

        let response = try await chatCompletion(messages: messages, temperature: 0.7)
        return response.content
    }

    // MARK: - Internal

    private func request<T: Decodable>(_ method: String, path: String, body: [String: Any]? = nil) async throws -> T {
        guard let apiKey, !apiKey.isEmpty else {
            throw OpenRouterError.missingAPIKey
        }

        var urlRequest = URLRequest(url: baseURL.appendingPathComponent(path))
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        urlRequest.setValue("Scythe", forHTTPHeaderField: "X-Title")

        if let body {
            urlRequest.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await URLSession.shared.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw OpenRouterError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw OpenRouterError.httpError(statusCode: httpResponse.statusCode)
        }

        return try JSONDecoder().decode(T.self, from: data)
    }
}

// MARK: - Types

struct ChatMessage: Codable {
    let role: String
    let content: String

    static func system(_ content: String) -> ChatMessage {
        ChatMessage(role: "system", content: content)
    }

    static func user(_ content: String) -> ChatMessage {
        ChatMessage(role: "user", content: content)
    }

    static func assistant(_ content: String) -> ChatMessage {
        ChatMessage(role: "assistant", content: content)
    }

    func toDictionary() -> [String: String] {
        ["role": role, "content": content]
    }
}

struct ChatResponse: Decodable {
    let id: String
    let model: String
    let choices: [Choice]
    let usage: Usage?

    struct Choice: Decodable {
        let message: ResponseMessage
        let finishReason: String?

        enum CodingKeys: String, CodingKey {
            case message
            case finishReason = "finish_reason"
        }
    }

    struct ResponseMessage: Decodable {
        let role: String
        let content: String
    }

    struct Usage: Decodable {
        let promptTokens: Int
        let completionTokens: Int
        let totalTokens: Int

        enum CodingKeys: String, CodingKey {
            case promptTokens = "prompt_tokens"
            case completionTokens = "completion_tokens"
            case totalTokens = "total_tokens"
        }
    }

    var content: String {
        choices.first?.message.content ?? ""
    }
}

enum OpenRouterError: LocalizedError {
    case missingAPIKey
    case invalidResponse
    case httpError(statusCode: Int)

    var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "OpenRouter API key not configured."
        case .invalidResponse:
            return "Invalid response from OpenRouter."
        case .httpError(let code):
            return "OpenRouter error (\(code))."
        }
    }
}
