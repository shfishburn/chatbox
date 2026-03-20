import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        NavigationStack {
            List {
                Section("Connected Accounts") {
                    ConnectionRow(
                        icon: "building.columns",
                        title: "Bank Account",
                        subtitle: appState.currentUser?.plaidConnected == true ? "Connected via Plaid" : "Not connected",
                        isConnected: appState.currentUser?.plaidConnected ?? false,
                        onConnect: {
                            // TODO: Launch Plaid Link
                        }
                    )

                    ConnectionRow(
                        icon: "envelope",
                        title: "Gmail",
                        subtitle: appState.currentUser?.gmailConnected == true ? "Connected — billing senders only" : "Not connected",
                        isConnected: appState.currentUser?.gmailConnected ?? false,
                        onConnect: {
                            // TODO: Launch Gmail OAuth
                        }
                    )
                }

                if let user = appState.currentUser {
                    Section("Financial Overview") {
                        if let income = user.monthlyIncomeCents {
                            LabeledContent("Monthly Income",
                                value: String(format: "$%.0f", Double(income) / 100.0))
                        }
                        if let ratio = user.subscriptionToIncomeRatio {
                            LabeledContent("Sub-to-Income Ratio",
                                value: String(format: "%.1f%%", ratio * 100))
                        }
                    }
                }

                Section("Subscription") {
                    LabeledContent("Plan", value: "Free Trial")
                    Button("Upgrade to Pro — $4.99/mo") {
                        // TODO: In-app purchase or Stripe checkout
                    }
                }

                Section("Intelligence") {
                    NavigationLink {
                        PipelineStatusView()
                    } label: {
                        HStack {
                            Image(systemName: "brain.head.profile")
                                .foregroundStyle(.purple)
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Detection Engines")
                                    .font(.body)
                                Text("5 OpenClaw pipelines — powered by local AI")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                Section("Privacy & Security") {
                    HStack(spacing: 8) {
                        Image(systemName: "lock.shield.fill")
                            .foregroundStyle(.green)
                        Text("PII processed locally via Phi-4 14B. Non-sensitive tasks routed through OpenRouter. Your raw financial data never leaves your VPC.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    NavigationLink("Privacy Policy") {
                        // TODO: Privacy policy webview
                        Text("Privacy Policy")
                    }
                    NavigationLink("Terms of Service") {
                        // TODO: ToS webview
                        Text("Terms of Service")
                    }
                }

                Section("About") {
                    LabeledContent("Version", value: "1.0.0")
                    LabeledContent("Build", value: "1")
                }

                Section {
                    Button("Sign Out", role: .destructive) {
                        appState.isAuthenticated = false
                        appState.hasCompletedOnboarding = false
                        appState.currentUser = nil
                    }
                }
            }
            .navigationTitle("Settings")
            .listStyle(.insetGrouped)
        }
    }
}

struct ConnectionRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let isConnected: Bool
    let onConnect: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(isConnected ? .green : .secondary)
                .frame(width: 28)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(isConnected ? .green : .secondary)
            }

            Spacer()

            if isConnected {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            } else {
                Button("Connect", action: onConnect)
                    .font(.subheadline.bold())
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
            }
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(AppState())
}
