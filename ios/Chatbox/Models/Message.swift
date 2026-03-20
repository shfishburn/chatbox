import Foundation

struct Message: Identifiable, Equatable {
    let id: UUID
    let content: String
    let role: Role
    let timestamp: Date

    enum Role: String {
        case user
        case assistant
    }

    init(id: UUID = UUID(), content: String, role: Role, timestamp: Date = Date()) {
        self.id = id
        self.content = content
        self.role = role
        self.timestamp = timestamp
    }
}
