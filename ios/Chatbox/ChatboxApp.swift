import SwiftUI

@main
struct ScytheApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var subscriptionVM = SubscriptionViewModel()
    @StateObject private var alertsVM = AlertsViewModel()

    var body: some Scene {
        WindowGroup {
            Group {
                if !appState.hasCompletedOnboarding {
                    OnboardingFlow()
                } else {
                    MainTabView()
                }
            }
            .environmentObject(appState)
            .environmentObject(subscriptionVM)
            .environmentObject(alertsVM)
        }
    }
}
