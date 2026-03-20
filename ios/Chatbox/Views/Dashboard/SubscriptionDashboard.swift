import SwiftUI

struct SubscriptionDashboard: View {
    @EnvironmentObject var viewModel: SubscriptionViewModel
    @State private var selectedFilter: FilterOption = .active
    @State private var selectedSubscription: Subscription?
    @State private var showKillConfirmation = false

    enum FilterOption: String, CaseIterable {
        case active = "Active"
        case flagged = "Flagged"
        case killed = "Killed"
    }

    var filteredSubscriptions: [Subscription] {
        switch selectedFilter {
        case .active: return viewModel.activeSubscriptions
        case .flagged: return viewModel.flaggedSubscriptions
        case .killed: return viewModel.killedSubscriptions
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                spendHeader
                filterPicker

                if viewModel.isLoading {
                    Spacer()
                    ProgressView("Scanning subscriptions...")
                    Spacer()
                } else if filteredSubscriptions.isEmpty {
                    emptyState
                } else {
                    subscriptionList
                }
            }
            .navigationTitle("Subscriptions")
            .task {
                await viewModel.loadSubscriptions()
            }
            .refreshable {
                await viewModel.loadSubscriptions()
            }
            .sheet(item: $selectedSubscription) { subscription in
                SubscriptionDetailSheet(
                    subscription: subscription,
                    card: viewModel.virtualCards[subscription.id]
                )
            }
            .confirmationDialog(
                "Kill this subscription?",
                isPresented: $showKillConfirmation,
                presenting: selectedSubscription
            ) { subscription in
                Button("Kill — Close Card Permanently", role: .destructive) {
                    Task { await viewModel.killSubscription(subscription) }
                }
                Button("Cancel", role: .cancel) {}
            } message: { subscription in
                Text("This will permanently close the virtual card for \(subscription.merchantName). The merchant's next charge will hard-bounce. This cannot be undone.")
            }
        }
    }

    private var spendHeader: some View {
        VStack(spacing: 4) {
            Text("Monthly Spend")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(viewModel.totalMonthlyFormatted)
                .font(.system(.title, design: .rounded, weight: .bold))
            Text("\(viewModel.activeSubscriptions.count) active subscriptions")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
    }

    private var filterPicker: some View {
        Picker("Filter", selection: $selectedFilter) {
            ForEach(FilterOption.allCases, id: \.self) { option in
                Text(option.rawValue).tag(option)
            }
        }
        .pickerStyle(.segmented)
        .padding()
    }

    private var subscriptionList: some View {
        List(filteredSubscriptions) { subscription in
            SubscriptionRow(
                subscription: subscription,
                card: viewModel.virtualCards[subscription.id],
                onKill: {
                    selectedSubscription = subscription
                    showKillConfirmation = true
                },
                onPause: {
                    Task { await viewModel.pauseSubscription(subscription) }
                },
                onResume: {
                    Task { await viewModel.resumeSubscription(subscription) }
                },
                onTap: {
                    selectedSubscription = subscription
                }
            )
        }
        .listStyle(.plain)
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Spacer()
            Image(systemName: selectedFilter == .killed ? "checkmark.circle" : "tray")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text(selectedFilter == .killed ? "No killed subscriptions yet" : "No \(selectedFilter.rawValue.lowercased()) subscriptions")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
        }
    }
}

// MARK: - Subscription Row

struct SubscriptionRow: View {
    let subscription: Subscription
    let card: VirtualCard?
    let onKill: () -> Void
    let onPause: () -> Void
    let onResume: () -> Void
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                merchantIcon

                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text(subscription.merchantName)
                            .font(.body.bold())
                        if subscription.isOnTrial {
                            Text("TRIAL")
                                .font(.caption2.bold())
                                .foregroundStyle(.white)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(.orange)
                                .clipShape(Capsule())
                        }
                    }
                    Text("\(subscription.amountFormatted)/\(subscription.frequency.rawValue.lowercased())")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                if subscription.status != .killed {
                    cardActions
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            if subscription.status == .active {
                Button(role: .destructive, action: onKill) {
                    Label("Kill", systemImage: "scissors")
                }
                Button(action: onPause) {
                    Label("Pause", systemImage: "pause.circle")
                }
                .tint(.orange)
            }
        }
    }

    private var merchantIcon: some View {
        Circle()
            .fill(subscription.status == .killed ? Color(.systemGray4) : Color.red.opacity(0.15))
            .frame(width: 40, height: 40)
            .overlay {
                Text(String(subscription.merchantName.prefix(1)))
                    .font(.headline.bold())
                    .foregroundStyle(subscription.status == .killed ? .secondary : .red)
            }
    }

    @ViewBuilder
    private var cardActions: some View {
        if let card {
            switch card.state {
            case .open:
                Image(systemName: "creditcard.fill")
                    .foregroundStyle(.green)
                    .font(.caption)
            case .paused:
                Image(systemName: "pause.circle.fill")
                    .foregroundStyle(.orange)
                    .font(.caption)
            case .closed:
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.red)
                    .font(.caption)
            }
        }
    }
}

// MARK: - Detail Sheet

struct SubscriptionDetailSheet: View {
    let subscription: Subscription
    let card: VirtualCard?

    var body: some View {
        NavigationStack {
            List {
                Section("Subscription") {
                    LabeledContent("Merchant", value: subscription.merchantName)
                    LabeledContent("Amount", value: subscription.amountFormatted)
                    LabeledContent("Frequency", value: subscription.frequency.rawValue)
                    LabeledContent("Status", value: subscription.status.rawValue)
                    LabeledContent("Detected", value: subscription.detectedAt.formatted(date: .abbreviated, time: .omitted))
                    LabeledContent("Source", value: subscription.provisioningTrigger == .gmailTrial ? "Gmail Trial" : "Plaid")

                    if let trialEnd = subscription.trialEndDate {
                        LabeledContent("Trial Ends", value: trialEnd.formatted(date: .abbreviated, time: .omitted))
                    }

                    if let annualPrice = subscription.annualPriceCents {
                        let annualFormatted = String(format: "$%.2f", Double(annualPrice) / 100.0)
                        LabeledContent("Annual Price", value: annualFormatted)
                    }
                }

                if let card {
                    Section("Virtual Card") {
                        LabeledContent("State", value: card.state.rawValue)
                        LabeledContent("Spend Limit", value: card.spendLimitFormatted)
                        LabeledContent("Interchange Earned", value: card.interchangeFormatted)
                        LabeledContent("Created", value: card.createdAt.formatted(date: .abbreviated, time: .omitted))
                        if let closed = card.closedAt {
                            LabeledContent("Closed", value: closed.formatted(date: .abbreviated, time: .omitted))
                        }
                    }
                }

                if !subscription.priceHistory.isEmpty {
                    Section("Price History") {
                        ForEach(subscription.priceHistory, id: \.detectedAt) { point in
                            LabeledContent(
                                point.detectedAt.formatted(date: .abbreviated, time: .omitted),
                                value: String(format: "$%.2f", Double(point.amount) / 100.0)
                            )
                        }
                    }
                }
            }
            .navigationTitle(subscription.merchantName)
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium, .large])
    }
}

#Preview {
    SubscriptionDashboard()
        .environmentObject(SubscriptionViewModel())
}
