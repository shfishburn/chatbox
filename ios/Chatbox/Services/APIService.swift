import Foundation

/// Stub API service — replace with your actual backend integration.
actor APIService {
    static let shared = APIService()

    private var baseURL: URL? {
        // TODO: Set your API base URL here
        URL(string: "https://your-api.example.com")
    }

    func sendMessage(_ content: String) async throws -> String {
        // TODO: Implement actual API call
        // Example:
        //   var request = URLRequest(url: baseURL!.appendingPathComponent("/api/chat"))
        //   request.httpMethod = "POST"
        //   request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        //   let body = ["message": content]
        //   request.httpBody = try JSONEncoder().encode(body)
        //   let (data, _) = try await URLSession.shared.data(for: request)
        //   let response = try JSONDecoder().decode(ChatResponse.self, from: data)
        //   return response.message

        throw APIError.notImplemented
    }

    enum APIError: LocalizedError {
        case notImplemented
        case networkError(Error)

        var errorDescription: String? {
            switch self {
            case .notImplemented:
                return "API integration not yet implemented."
            case .networkError(let error):
                return error.localizedDescription
            }
        }
    }
}
