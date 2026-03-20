import Foundation
import SwiftUI

// MARK: - App State

@MainActor
class AppState: ObservableObject {
    @Published var currentUser: User?
    @Published var isAuthenticated = false
    @Published var hasCompletedOnboarding = false
    @Published var showFinancialAutopsy = false
}

// MARK: - Subscription View Model

@MainActor
class SubscriptionViewModel: ObservableObject {
    @Published var subscriptions: [Subscription] = []
    @Published var virtualCards: [UUID: VirtualCard] = [:]
    @Published var isLoading = false
    @Published var error: String?

    var activeSubscriptions: [Subscription] {
        subscriptions.filter { $0.status == .active }
    }

    var flaggedSubscriptions: [Subscription] {
        subscriptions.filter { $0.status == .flagged }
    }

    var killedSubscriptions: [Subscription] {
        subscriptions.filter { $0.status == .killed }
    }

    var totalMonthlySpend: Int {
        activeSubscriptions.reduce(0) { total, sub in
            switch sub.frequency {
            case .weekly: return total + (sub.amountCents * 4)
            case .monthly: return total + sub.amountCents
            case .annual: return total + (sub.amountCents / 12)
            }
        }
    }

    var totalMonthlyFormatted: String {
        let dollars = Double(totalMonthlySpend) / 100.0
        return String(format: "$%.2f", dollars)
    }

    func loadSubscriptions() async {
        isLoading = true
        defer { isLoading = false }

        do {
            subscriptions = try await ScytheAPIService.shared.fetchSubscriptions()
            let cards = try await ScytheAPIService.shared.fetchVirtualCards()
            virtualCards = Dictionary(uniqueKeysWithValues: cards.map { ($0.subscriptionId, $0) })
        } catch {
            self.error = error.localizedDescription
        }
    }

    func killSubscription(_ subscription: Subscription) async {
        guard let card = virtualCards[subscription.id] else { return }

        do {
            try await ScytheAPIService.shared.closeCard(token: card.lithicToken)
            if let idx = subscriptions.firstIndex(where: { $0.id == subscription.id }) {
                subscriptions[idx].status = .killed
            }
            virtualCards[subscription.id]?.state = .closed
            virtualCards[subscription.id]?.closedAt = Date()
        } catch {
            self.error = error.localizedDescription
        }
    }

    func pauseSubscription(_ subscription: Subscription) async {
        guard let card = virtualCards[subscription.id] else { return }

        do {
            try await ScytheAPIService.shared.pauseCard(token: card.lithicToken)
            virtualCards[subscription.id]?.state = .paused
        } catch {
            self.error = error.localizedDescription
        }
    }

    func resumeSubscription(_ subscription: Subscription) async {
        guard let card = virtualCards[subscription.id] else { return }

        do {
            try await ScytheAPIService.shared.resumeCard(token: card.lithicToken)
            virtualCards[subscription.id]?.state = .open
        } catch {
            self.error = error.localizedDescription
        }
    }
}

// MARK: - Autopsy View Model

@MainActor
class AutopsyViewModel: ObservableObject {
    @Published var autopsy: FinancialAutopsy?
    @Published var isLoading = false
    @Published var isRevealed = false

    func loadAutopsy() async {
        isLoading = true
        defer { isLoading = false }

        do {
            autopsy = try await ScytheAPIService.shared.fetchFinancialAutopsy()
        } catch {
            // Fallback to demo data for onboarding
            autopsy = FinancialAutopsy(
                forgottenSubscriptionsYearly: 84700,
                priceHikesAbsorbedYearly: 31200,
                trialsConvertedYearly: 15600,
                rewardsLeftOnTableYearly: 34000
            )
        }
    }
}

// MARK: - Alerts View Model

@MainActor
class AlertsViewModel: ObservableObject {
    @Published var savingsEvents: [SavingsEvent] = []
    @Published var pendingAlerts: [ScytheAlert] = []
    @Published var isLoading = false

    func loadAlerts() async {
        isLoading = true
        defer { isLoading = false }

        do {
            savingsEvents = try await ScytheAPIService.shared.fetchSavingsEvents()
            pendingAlerts = try await ScytheAPIService.shared.fetchPendingAlerts()
        } catch {
            // Handle silently — alerts are non-critical
        }
    }

    var totalSavedCents: Int {
        savingsEvents.reduce(0) { $0 + $1.savingsCents }
    }

    var totalSavedFormatted: String {
        let dollars = Double(totalSavedCents) / 100.0
        return String(format: "$%.2f", dollars)
    }
}

// MARK: - Alert Model

struct ScytheAlert: Identifiable, Codable {
    let id: UUID
    var alertType: AlertType
    var merchantName: String
    var headline: String
    var detail: String
    var actionLabel: String?
    var savingsCents: Int?
    let createdAt: Date
    var dismissed: Bool

    enum AlertType: String, Codable {
        case priceHike = "PRICE_HIKE"
        case trialEnding = "TRIAL_ENDING"
        case annualSavings = "ANNUAL_SAVINGS"
        case rewardsGap = "REWARDS_GAP"
        case billNegotiable = "BILL_NEGOTIABLE"
    }
}
