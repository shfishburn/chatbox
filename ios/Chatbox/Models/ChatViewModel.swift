import Foundation
import SwiftUI

@MainActor
class ChatViewModel: ObservableObject {
    @Published var messages: [Message] = []
    @Published var inputText: String = ""
    @Published var isLoading: Bool = false

    func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        let userMessage = Message(content: text, role: .user)
        messages.append(userMessage)
        inputText = ""

        isLoading = true

        // TODO: Integrate with your chat backend/API
        // For now, echo back a placeholder response
        Task {
            try? await Task.sleep(for: .seconds(1))
            let response = Message(content: "This is a placeholder response. Connect to your API to get real responses.", role: .assistant)
            messages.append(response)
            isLoading = false
        }
    }
}
