import SwiftUI

struct OnboardingFlow: View {
    @EnvironmentObject var appState: AppState
    @State private var step: OnboardingStep = .welcome

    enum OnboardingStep {
        case welcome
        case connectBank
        case connectGmail
        case autopsy
    }

    var body: some View {
        NavigationStack {
            Group {
                switch step {
                case .welcome:
                    WelcomeView(onContinue: { step = .connectBank })
                case .connectBank:
                    ConnectBankView(onConnected: { step = .connectGmail }, onSkip: { step = .connectGmail })
                case .connectGmail:
                    ConnectGmailView(onConnected: { step = .autopsy }, onSkip: { step = .autopsy })
                case .autopsy:
                    FinancialAutopsyView(onComplete: {
                        appState.hasCompletedOnboarding = true
                    })
                }
            }
            .animation(.easeInOut, value: step)
        }
    }
}

// MARK: - Welcome

struct WelcomeView: View {
    let onContinue: () -> Void

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            Image(systemName: "scissors")
                .font(.system(size: 72))
                .foregroundStyle(.red)

            VStack(spacing: 12) {
                Text("Scythe")
                    .font(.largeTitle.bold())

                Text("Scythe doesn't cancel your subscriptions.\nIt makes your payment card disappear.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            VStack(spacing: 8) {
                FeatureRow(icon: "creditcard.trianglebadge.exclamationmark", text: "Detect forgotten subscriptions")
                FeatureRow(icon: "scissors", text: "Kill cards — merchants get nothing")
                FeatureRow(icon: "bell.badge", text: "Catch price hikes & expiring trials")
                FeatureRow(icon: "lock.shield", text: "Your data never leaves your device")
            }
            .padding(.horizontal, 24)

            Spacer()

            Button(action: onContinue) {
                Text("Get Started")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.red)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
    }
}

struct FeatureRow: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.red)
                .frame(width: 32)
            Text(text)
                .font(.subheadline)
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Connect Bank

struct ConnectBankView: View {
    let onConnected: () -> Void
    let onSkip: () -> Void
    @State private var isConnecting = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "building.columns")
                .font(.system(size: 56))
                .foregroundStyle(.blue)

            Text("Connect Your Bank")
                .font(.title2.bold())

            Text("Scythe uses Plaid to securely detect your recurring subscriptions. We never see your login credentials.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()

            VStack(spacing: 12) {
                Button(action: {
                    isConnecting = true
                    // TODO: Launch Plaid Link SDK
                    Task {
                        try? await Task.sleep(for: .seconds(1))
                        isConnecting = false
                        onConnected()
                    }
                }) {
                    HStack {
                        if isConnecting {
                            ProgressView()
                                .tint(.white)
                        }
                        Text(isConnecting ? "Connecting..." : "Connect with Plaid")
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.blue)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(isConnecting)

                Button("Skip for now", action: onSkip)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
    }
}

// MARK: - Connect Gmail

struct ConnectGmailView: View {
    let onConnected: () -> Void
    let onSkip: () -> Void
    @State private var isConnecting = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "envelope.badge")
                .font(.system(size: 56))
                .foregroundStyle(.orange)

            Text("Connect Gmail")
                .font(.title2.bold())

            Text("Enable the Trial Sentinel. Scythe reads only billing-related emails to detect free trials before they convert.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            HStack(spacing: 8) {
                Image(systemName: "lock.fill")
                    .font(.caption)
                Text("gmail.readonly — billing senders only")
                    .font(.caption)
            }
            .foregroundStyle(.secondary)
            .padding(8)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 8))

            Spacer()

            VStack(spacing: 12) {
                Button(action: {
                    isConnecting = true
                    // TODO: Launch Gmail OAuth flow
                    Task {
                        try? await Task.sleep(for: .seconds(1))
                        isConnecting = false
                        onConnected()
                    }
                }) {
                    HStack {
                        if isConnecting {
                            ProgressView()
                                .tint(.white)
                        }
                        Text(isConnecting ? "Connecting..." : "Connect Gmail")
                            .font(.headline)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.orange)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .disabled(isConnecting)

                Button("Skip for now", action: onSkip)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
    }
}
