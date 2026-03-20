import Foundation

// MARK: - User

struct User: Identifiable, Codable {
    let id: UUID
    var email: String
    var monthlyIncomeCents: Int?
    var subscriptionToIncomeRatio: Double?
    var plaidConnected: Bool
    var gmailConnected: Bool
    let createdAt: Date
}

// MARK: - Funding Source

struct FundingSource: Identifiable, Codable {
    let id: UUID
    let userId: UUID
    var plaidItemId: String
    var institutionName: String
    var lastFour: String
    var cardRewardsRate: Double?
}

// MARK: - Subscription

struct Subscription: Identifiable, Codable {
    let id: UUID
    let userId: UUID
    var merchantName: String
    var rawDescriptor: String
    var amountCents: Int
    var frequency: Frequency
    var priceHistory: [PricePoint]
    var trialEndDate: Date?
    var annualPriceCents: Int?
    var detectedAt: Date
    var provisioningTrigger: ProvisioningTrigger
    var status: SubscriptionStatus

    enum Frequency: String, Codable, CaseIterable {
        case weekly = "WEEKLY"
        case monthly = "MONTHLY"
        case annual = "ANNUAL"
    }

    enum ProvisioningTrigger: String, Codable {
        case gmailTrial = "GMAIL_TRIAL"
        case plaidRecurring = "PLAID_RECURRING"
    }

    enum SubscriptionStatus: String, Codable {
        case active = "ACTIVE"
        case flagged = "FLAGGED"
        case killed = "KILLED"
    }

    var amountFormatted: String {
        let dollars = Double(amountCents) / 100.0
        return String(format: "$%.2f", dollars)
    }

    var annualizedCents: Int {
        switch frequency {
        case .weekly: return amountCents * 52
        case .monthly: return amountCents * 12
        case .annual: return amountCents
        }
    }

    var isOnTrial: Bool {
        guard let trialEnd = trialEndDate else { return false }
        return trialEnd > Date()
    }

    var daysUntilTrialEnds: Int? {
        guard let trialEnd = trialEndDate, trialEnd > Date() else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: trialEnd).day
    }
}

struct PricePoint: Codable, Equatable {
    let amount: Int
    let detectedAt: Date
}

// MARK: - Virtual Card

struct VirtualCard: Identifiable, Codable {
    let id: UUID
    let subscriptionId: UUID
    var lithicToken: UUID
    var merchantDescriptor: String
    var spendLimitCents: Int
    var state: CardState
    var interchangeEarnedCents: Int
    let createdAt: Date
    var closedAt: Date?

    enum CardState: String, Codable, CaseIterable {
        case open = "OPEN"
        case paused = "PAUSED"
        case closed = "CLOSED"
    }

    var spendLimitFormatted: String {
        let dollars = Double(spendLimitCents) / 100.0
        return String(format: "$%.2f", dollars)
    }

    var interchangeFormatted: String {
        let dollars = Double(interchangeEarnedCents) / 100.0
        return String(format: "$%.2f", dollars)
    }
}

// MARK: - Cancellation Fee

struct CancellationFee: Identifiable, Codable {
    let id: UUID
    let subscriptionId: UUID
    var annualizedValueCents: Int
    var feeRate: Double
    var feeCents: Int
    var chargedAt: Date?
    var confirmedByUser: Bool
}

// MARK: - Savings Event

struct SavingsEvent: Identifiable, Codable {
    let id: UUID
    let userId: UUID
    var eventType: EventType
    var merchantName: String
    var savingsCents: Int
    var feeCents: Int
    let createdAt: Date

    enum EventType: String, Codable, CaseIterable {
        case priceHikeCaught = "PRICE_HIKE_CAUGHT"
        case trialKilled = "TRIAL_KILLED"
        case annualSwitch = "ANNUAL_SWITCH"
        case rewardsArbitrage = "REWARDS_ARBITRAGE"
        case billNegotiated = "BILL_NEGOTIATED"
    }

    var savingsFormatted: String {
        let dollars = Double(savingsCents) / 100.0
        return String(format: "$%.2f", dollars)
    }

    var displayTitle: String {
        switch eventType {
        case .priceHikeCaught: return "Price Hike Caught"
        case .trialKilled: return "Trial Killed"
        case .annualSwitch: return "Annual Switch"
        case .rewardsArbitrage: return "Rewards Recaptured"
        case .billNegotiated: return "Bill Negotiated"
        }
    }
}

// MARK: - Financial Autopsy

struct FinancialAutopsy {
    var forgottenSubscriptionsYearly: Int
    var priceHikesAbsorbedYearly: Int
    var trialsConvertedYearly: Int
    var rewardsLeftOnTableYearly: Int

    var totalRecoverableYearly: Int {
        forgottenSubscriptionsYearly + priceHikesAbsorbedYearly + trialsConvertedYearly + rewardsLeftOnTableYearly
    }

    func formatted(_ cents: Int) -> String {
        let dollars = Double(cents) / 100.0
        return String(format: "$%.0f", dollars)
    }
}
