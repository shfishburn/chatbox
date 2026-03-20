import SwiftUI

struct CardManagementView: View {
    @EnvironmentObject var viewModel: SubscriptionViewModel

    var allCards: [(subscription: Subscription, card: VirtualCard)] {
        viewModel.subscriptions.compactMap { sub in
            guard let card = viewModel.virtualCards[sub.id] else { return nil }
            return (sub, card)
        }
        .sorted { $0.card.createdAt > $1.card.createdAt }
    }

    var openCards: [(subscription: Subscription, card: VirtualCard)] {
        allCards.filter { $0.card.state == .open }
    }

    var pausedCards: [(subscription: Subscription, card: VirtualCard)] {
        allCards.filter { $0.card.state == .paused }
    }

    var closedCards: [(subscription: Subscription, card: VirtualCard)] {
        allCards.filter { $0.card.state == .closed }
    }

    var totalInterchange: Int {
        allCards.reduce(0) { $0 + $1.card.interchangeEarnedCents }
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        StatBox(title: "Active", value: "\(openCards.count)", color: .green)
                        StatBox(title: "Paused", value: "\(pausedCards.count)", color: .orange)
                        StatBox(title: "Closed", value: "\(closedCards.count)", color: .red)
                    }
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)

                    HStack {
                        Text("Interchange Earned")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(String(format: "$%.2f", Double(totalInterchange) / 100.0))
                            .font(.subheadline.bold())
                            .foregroundStyle(.green)
                    }
                }

                if !openCards.isEmpty {
                    Section("Open Cards") {
                        ForEach(openCards, id: \.card.id) { item in
                            VirtualCardRow(subscription: item.subscription, card: item.card)
                        }
                    }
                }

                if !pausedCards.isEmpty {
                    Section("Paused Cards") {
                        ForEach(pausedCards, id: \.card.id) { item in
                            VirtualCardRow(subscription: item.subscription, card: item.card)
                        }
                    }
                }

                if !closedCards.isEmpty {
                    Section("Closed Cards") {
                        ForEach(closedCards, id: \.card.id) { item in
                            VirtualCardRow(subscription: item.subscription, card: item.card)
                        }
                    }
                }
            }
            .navigationTitle("Virtual Cards")
            .listStyle(.insetGrouped)
        }
    }
}

struct StatBox: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(.title2, design: .rounded, weight: .bold))
                .foregroundStyle(color)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

struct VirtualCardRow: View {
    let subscription: Subscription
    let card: VirtualCard

    var stateColor: Color {
        switch card.state {
        case .open: return .green
        case .paused: return .orange
        case .closed: return .red
        }
    }

    var stateIcon: String {
        switch card.state {
        case .open: return "creditcard.fill"
        case .paused: return "pause.circle.fill"
        case .closed: return "xmark.circle.fill"
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: stateIcon)
                .foregroundStyle(stateColor)
                .font(.title3)

            VStack(alignment: .leading, spacing: 2) {
                Text(subscription.merchantName)
                    .font(.body)
                Text("Limit: \(card.spendLimitFormatted)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(card.state.rawValue)
                    .font(.caption.bold())
                    .foregroundStyle(stateColor)
                if card.interchangeEarnedCents > 0 {
                    Text("+\(card.interchangeFormatted)")
                        .font(.caption2)
                        .foregroundStyle(.green)
                }
            }
        }
    }
}

#Preview {
    CardManagementView()
        .environmentObject(SubscriptionViewModel())
}
