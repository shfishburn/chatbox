import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var subscriptionVM: SubscriptionViewModel
    @EnvironmentObject var alertsVM: AlertsViewModel

    var body: some View {
        TabView {
            SubscriptionDashboard()
                .tabItem {
                    Label("Subscriptions", systemImage: "repeat")
                }

            TrialSentinelView()
                .tabItem {
                    Label("Trials", systemImage: "shield.checkered")
                }

            AlertsView()
                .tabItem {
                    Label("Insights", systemImage: "lightbulb")
                }

            CardManagementView()
                .tabItem {
                    Label("Cards", systemImage: "creditcard")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
        }
        .tint(.red)
    }
}

#Preview {
    MainTabView()
        .environmentObject(SubscriptionViewModel())
        .environmentObject(AlertsViewModel())
        .environmentObject(AppState())
}
