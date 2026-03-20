import Foundation

/// Central API client for the Scythe backend.
/// All financial data flows through your backend — the iOS app never talks directly
/// to Plaid, Lithic, or Gmail APIs.
actor ScytheAPIService {
    static let shared = ScytheAPIService()

    // TODO: Set your backend base URL
    private let baseURL = URL(string: "https://api.scythe.app")!

    private var authToken: String?

    func setAuthToken(_ token: String) {
        self.authToken = token
    }

    // MARK: - Subscriptions

    func fetchSubscriptions() async throws -> [Subscription] {
        try await request("GET", path: "/subscriptions")
    }

    func fetchVirtualCards() async throws -> [VirtualCard] {
        try await request("GET", path: "/cards")
    }

    // MARK: - Card Commands (Burner Protocol)

    func closeCard(token: UUID) async throws {
        let _: EmptyResponse = try await request("PATCH", path: "/cards/\(token)", body: ["state": "CLOSED"])
    }

    func pauseCard(token: UUID) async throws {
        let _: EmptyResponse = try await request("PATCH", path: "/cards/\(token)", body: ["state": "PAUSED"])
    }

    func resumeCard(token: UUID) async throws {
        let _: EmptyResponse = try await request("PATCH", path: "/cards/\(token)", body: ["state": "OPEN"])
    }

    // MARK: - Financial Autopsy

    func fetchFinancialAutopsy() async throws -> FinancialAutopsy {
        try await request("GET", path: "/autopsy")
    }

    // MARK: - Alerts & Savings

    func fetchSavingsEvents() async throws -> [SavingsEvent] {
        try await request("GET", path: "/savings")
    }

    func fetchPendingAlerts() async throws -> [ScytheAlert] {
        try await request("GET", path: "/alerts")
    }

    func dismissAlert(id: UUID) async throws {
        let _: EmptyResponse = try await request("POST", path: "/alerts/\(id)/dismiss")
    }

    // MARK: - Onboarding / OAuth

    func initiatePlaidLink() async throws -> PlaidLinkConfig {
        try await request("POST", path: "/plaid/link-token")
    }

    func exchangePlaidToken(publicToken: String) async throws {
        let _: EmptyResponse = try await request("POST", path: "/plaid/exchange", body: ["public_token": publicToken])
    }

    func initiateGmailOAuth() async throws -> GmailOAuthConfig {
        try await request("POST", path: "/gmail/auth-url")
    }

    func exchangeGmailCode(code: String) async throws {
        let _: EmptyResponse = try await request("POST", path: "/gmail/exchange", body: ["code": code])
    }

    // MARK: - User

    func fetchCurrentUser() async throws -> User {
        try await request("GET", path: "/me")
    }

    // MARK: - Cancellation Fee Confirmation

    func confirmCancellationFee(subscriptionId: UUID) async throws -> CancellationFee {
        try await request("POST", path: "/subscriptions/\(subscriptionId)/confirm-kill")
    }

    // MARK: - OpenClaw Pipeline Status

    func fetchPipelineStatuses() async throws -> [PipelineStatus] {
        try await request("GET", path: "/pipelines/status")
    }

    func triggerPipeline(_ pipeline: ScythePipeline) async throws {
        let _: EmptyResponse = try await request("POST", path: "/pipelines/\(pipeline.rawValue)/trigger")
    }

    // MARK: - Internal

    private func request<T: Decodable>(_ method: String, path: String, body: [String: Any]? = nil) async throws -> T {
        var urlRequest = URLRequest(url: baseURL.appendingPathComponent(path))
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body {
            urlRequest.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await URLSession.shared.data(for: urlRequest)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw ScytheError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            throw ScytheError.httpError(statusCode: httpResponse.statusCode)
        }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return try decoder.decode(T.self, from: data)
    }
}

// MARK: - Supporting Types

struct EmptyResponse: Decodable {}

struct PlaidLinkConfig: Decodable {
    let linkToken: String
    let environment: String
}

struct GmailOAuthConfig: Decodable {
    let authUrl: String
}

enum ScytheError: LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int)
    case notImplemented

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid server response."
        case .httpError(let code):
            return "Server error (\(code))."
        case .notImplemented:
            return "Not yet implemented."
        }
    }
}
