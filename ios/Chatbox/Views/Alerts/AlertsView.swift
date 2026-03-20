import SwiftUI

struct AlertsView: View {
    @EnvironmentObject var alertsVM: AlertsViewModel

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                savingsHeader

                if alertsVM.isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if alertsVM.pendingAlerts.isEmpty && alertsVM.savingsEvents.isEmpty {
                    emptyState
                } else {
                    alertsList
                }
            }
            .navigationTitle("Insights")
            .task {
                await alertsVM.loadAlerts()
            }
            .refreshable {
                await alertsVM.loadAlerts()
            }
        }
    }

    private var savingsHeader: some View {
        VStack(spacing: 4) {
            Text("Total Saved")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(alertsVM.totalSavedFormatted)
                .font(.system(.title, design: .rounded, weight: .bold))
                .foregroundStyle(.green)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
    }

    private var alertsList: some View {
        List {
            if !alertsVM.pendingAlerts.isEmpty {
                Section("Action Needed") {
                    ForEach(alertsVM.pendingAlerts.filter { !$0.dismissed }) { alert in
                        AlertCard(alert: alert)
                    }
                }
            }

            if !alertsVM.savingsEvents.isEmpty {
                Section("Savings History") {
                    ForEach(alertsVM.savingsEvents) { event in
                        SavingsEventRow(event: event)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "bell.slash")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No Insights Yet")
                .font(.title3.bold())
            Text("Scythe is monitoring your subscriptions for price hikes, expiring trials, and savings opportunities.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
            Spacer()
        }
    }
}

// MARK: - Alert Card

struct AlertCard: View {
    let alert: ScytheAlert

    var alertColor: Color {
        switch alert.alertType {
        case .priceHike: return .red
        case .trialEnding: return .orange
        case .annualSavings: return .blue
        case .rewardsGap: return .purple
        case .billNegotiable: return .green
        }
    }

    var alertIcon: String {
        switch alert.alertType {
        case .priceHike: return "arrow.up.right.circle.fill"
        case .trialEnding: return "clock.badge.exclamationmark"
        case .annualSavings: return "calendar.badge.checkmark"
        case .rewardsGap: return "gift.fill"
        case .billNegotiable: return "phone.arrow.down.left"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: alertIcon)
                    .foregroundStyle(alertColor)
                Text(alert.merchantName)
                    .font(.subheadline.bold())
                Spacer()
                if let savings = alert.savingsCents {
                    Text(String(format: "$%.0f/yr", Double(savings) / 100.0))
                        .font(.subheadline.bold())
                        .foregroundStyle(.green)
                }
            }

            Text(alert.headline)
                .font(.body)

            Text(alert.detail)
                .font(.caption)
                .foregroundStyle(.secondary)

            if let action = alert.actionLabel {
                Button(action) {
                    // TODO: Handle alert action
                }
                .font(.subheadline.bold())
                .padding(.top, 4)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Savings Event Row

struct SavingsEventRow: View {
    let event: SavingsEvent

    var eventIcon: String {
        switch event.eventType {
        case .priceHikeCaught: return "exclamationmark.triangle"
        case .trialKilled: return "scissors"
        case .annualSwitch: return "calendar"
        case .rewardsArbitrage: return "gift"
        case .billNegotiated: return "phone"
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: eventIcon)
                .foregroundStyle(.green)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(event.displayTitle)
                    .font(.subheadline.bold())
                Text(event.merchantName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(event.savingsFormatted)
                    .font(.subheadline.bold())
                    .foregroundStyle(.green)
                Text(event.createdAt.formatted(date: .abbreviated, time: .omitted))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

#Preview {
    AlertsView()
        .environmentObject(AlertsViewModel())
}
