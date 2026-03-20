import SwiftUI

struct FinancialAutopsyView: View {
    let onComplete: () -> Void
    @StateObject private var viewModel = AutopsyViewModel()
    @State private var revealProgress: Double = 0
    @State private var showTotal = false

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 24) {
                    header
                    if let autopsy = viewModel.autopsy {
                        autopsyReport(autopsy)
                    } else if viewModel.isLoading {
                        scanningAnimation
                    }
                }
                .padding(24)
            }

            if showTotal {
                ctaButton
            }
        }
        .task {
            await viewModel.loadAutopsy()
            withAnimation(.easeOut(duration: 2.0)) {
                revealProgress = 1.0
            }
            try? await Task.sleep(for: .seconds(2.5))
            withAnimation(.spring(response: 0.5, dampingFraction: 0.6)) {
                showTotal = true
            }
        }
    }

    private var header: some View {
        VStack(spacing: 8) {
            Text("YOUR FINANCIAL AUTOPSY")
                .font(.caption.bold())
                .foregroundStyle(.red)
                .tracking(2)

            Text("Last 24 Months")
                .font(.title2.bold())
        }
    }

    private func autopsyReport(_ autopsy: FinancialAutopsy) -> some View {
        VStack(spacing: 16) {
            AutopsyLineItem(
                label: "Forgotten subscriptions still running",
                amount: autopsy.formatted(autopsy.forgottenSubscriptionsYearly) + "/yr",
                icon: "repeat",
                color: .red,
                delay: 0
            )

            AutopsyLineItem(
                label: "Price hikes you silently absorbed",
                amount: autopsy.formatted(autopsy.priceHikesAbsorbedYearly) + "/yr",
                icon: "arrow.up.right",
                color: .orange,
                delay: 0.5
            )

            AutopsyLineItem(
                label: "Trials that converted without your notice",
                amount: autopsy.formatted(autopsy.trialsConvertedYearly) + "/yr",
                icon: "clock.badge.exclamationmark",
                color: .yellow,
                delay: 1.0
            )

            AutopsyLineItem(
                label: "Rewards left on the table",
                amount: autopsy.formatted(autopsy.rewardsLeftOnTableYearly) + "/yr",
                icon: "gift",
                color: .purple,
                delay: 1.5
            )

            if showTotal {
                Divider()
                    .padding(.vertical, 4)

                HStack {
                    Text("TOTAL RECOVERABLE")
                        .font(.headline.bold())
                    Spacer()
                    Text(autopsy.formatted(autopsy.totalRecoverableYearly) + "/yr")
                        .font(.title.bold())
                        .foregroundStyle(.red)
                }
                .transition(.scale.combined(with: .opacity))
            }
        }
        .padding(20)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }

    private var scanningAnimation: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)
            Text("Scanning your financial history...")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(40)
    }

    private var ctaButton: some View {
        Button(action: onComplete) {
            Text("Start Recovering It")
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding()
                .background(.red)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .padding(24)
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }
}

struct AutopsyLineItem: View {
    let label: String
    let amount: String
    let icon: String
    let color: Color
    let delay: Double

    @State private var isVisible = false

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(color)
                .frame(width: 24)

            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Spacer()

            Text(amount)
                .font(.subheadline.bold().monospacedDigit())
        }
        .opacity(isVisible ? 1 : 0)
        .offset(x: isVisible ? 0 : 20)
        .onAppear {
            withAnimation(.easeOut(duration: 0.6).delay(delay)) {
                isVisible = true
            }
        }
    }
}

#Preview {
    FinancialAutopsyView(onComplete: {})
}
