import SwiftUI

struct TrialSentinelView: View {
    @EnvironmentObject var viewModel: SubscriptionViewModel
    @State private var showKillConfirmation = false
    @State private var selectedTrial: Subscription?

    var activeTrials: [Subscription] {
        viewModel.subscriptions
            .filter { $0.isOnTrial }
            .sorted { ($0.daysUntilTrialEnds ?? 0) < ($1.daysUntilTrialEnds ?? 0) }
    }

    var body: some View {
        NavigationStack {
            Group {
                if activeTrials.isEmpty {
                    emptyState
                } else {
                    trialList
                }
            }
            .navigationTitle("Trial Sentinel")
            .confirmationDialog(
                "Kill this trial?",
                isPresented: $showKillConfirmation,
                presenting: selectedTrial
            ) { trial in
                Button("Kill Now — Close Card", role: .destructive) {
                    Task { await viewModel.killSubscription(trial) }
                }
                Button("Cancel", role: .cancel) {}
            } message: { trial in
                Text("The virtual card for \(trial.merchantName) will be closed immediately. The trial conversion charge will hard-bounce.")
            }
        }
    }

    private var trialList: some View {
        List(activeTrials) { trial in
            TrialCard(
                trial: trial,
                onKill: {
                    selectedTrial = trial
                    showKillConfirmation = true
                }
            )
            .listRowSeparator(.hidden)
            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
        }
        .listStyle(.plain)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "shield.checkered")
                .font(.system(size: 56))
                .foregroundStyle(.green)

            Text("No Active Trials")
                .font(.title3.bold())

            Text("When Scythe detects a free trial from your email, it will appear here with a countdown timer.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Spacer()
        }
    }
}

struct TrialCard: View {
    let trial: Subscription
    let onKill: () -> Void

    var urgencyColor: Color {
        guard let days = trial.daysUntilTrialEnds else { return .gray }
        if days <= 2 { return .red }
        if days <= 5 { return .orange }
        return .green
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(trial.merchantName)
                        .font(.headline)
                    Text("Converts at \(trial.amountFormatted)/\(trial.frequency.rawValue.lowercased())")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                if let days = trial.daysUntilTrialEnds {
                    VStack(spacing: 2) {
                        Text("\(days)")
                            .font(.system(.title, design: .rounded, weight: .bold))
                            .foregroundStyle(urgencyColor)
                        Text(days == 1 ? "day left" : "days left")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if let trialEnd = trial.trialEndDate {
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.caption)
                    Text("Trial ends \(trialEnd.formatted(date: .abbreviated, time: .omitted))")
                        .font(.caption)
                }
                .foregroundStyle(.secondary)
            }

            HStack(spacing: 12) {
                Button(action: onKill) {
                    HStack(spacing: 6) {
                        Image(systemName: "scissors")
                        Text("Kill Before Conversion")
                    }
                    .font(.subheadline.bold())
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(.red)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }

                Button {
                    // TODO: Snooze / keep trial
                } label: {
                    Text("Keep")
                        .font(.subheadline.bold())
                        .padding(.vertical, 10)
                        .padding(.horizontal, 20)
                        .background(Color(.systemGray5))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
        .padding(16)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(urgencyColor.opacity(0.3), lineWidth: 1)
        )
    }
}

#Preview {
    TrialSentinelView()
        .environmentObject(SubscriptionViewModel())
}
