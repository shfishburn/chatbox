import SwiftUI

struct ContentView: View {
    @EnvironmentObject var viewModel: ChatViewModel

    var body: some View {
        NavigationStack {
            ChatView()
                .navigationTitle("Chatbox")
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(ChatViewModel())
}
