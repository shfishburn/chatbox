import SwiftUI

/// Shows the real-time status of Scythe's five OpenClaw intelligence pipelines.
/// Users can see when each engine last ran, what it found, and its next scheduled run.
struct PipelineStatusView: View {
    @State private var statuses: [PipelineStatus] = []
    @State private var isLoading = false

    var body: some View {
        List {
            Section {
                HStack(spacing: 8) {
                    Image(systemName: "brain.head.profile")
                        .foregroundStyle(.purple)
                    Text("Intelligence engines run automatically via OpenClaw. Raw financial data is processed locally — never sent to cloud AI.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Section("Detection Engines") {
                ForEach(ScythePipeline.allCases, id: \.rawValue) { pipeline in
                    let status = statuses.first { $0.pipeline == pipeline }
                    PipelineRow(pipeline: pipeline, status: status)
                }
            }

            Section("Model Routing") {
                LabeledContent("PII Processing") {
                    HStack(spacing: 4) {
                        Image(systemName: "lock.fill")
                            .font(.caption)
                            .foregroundStyle(.green)
                        Text("Local vLLM (Phi-4 14B)")
                            .font(.caption)
                    }
                }
                LabeledContent("Non-PII Tasks") {
                    HStack(spacing: 4) {
                        Image(systemName: "cloud")
                            .font(.caption)
                            .foregroundStyle(.blue)
                        Text("OpenRouter")
                            .font(.caption)
                    }
                }
            }
        }
        .navigationTitle("Intelligence Engines")
        .listStyle(.insetGrouped)
        .task {
            await loadStatuses()
        }
        .refreshable {
            await loadStatuses()
        }
    }

    private func loadStatuses() async {
        isLoading = true
        defer { isLoading = false }
        do {
            statuses = try await ScytheAPIService.shared.fetchPipelineStatuses()
        } catch {
            // Non-critical — show pipelines without status
        }
    }
}

struct PipelineRow: View {
    let pipeline: ScythePipeline
    let status: PipelineStatus?

    var stateColor: Color {
        guard let status else { return .secondary }
        switch status.state {
        case .idle: return .secondary
        case .running: return .blue
        case .completed: return .green
        case .failed: return .red
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: pipeline.icon)
                    .foregroundStyle(stateColor)
                    .frame(width: 24)

                Text(pipeline.displayName)
                    .font(.subheadline.bold())

                Spacer()

                if let status {
                    StatusBadge(state: status.state)
                }
            }

            Text(pipeline.description)
                .font(.caption)
                .foregroundStyle(.secondary)

            HStack(spacing: 16) {
                if pipeline.requiresLocalInference {
                    Label("Local", systemImage: "lock.fill")
                        .font(.caption2)
                        .foregroundStyle(.green)
                } else {
                    Label("Cloud", systemImage: "cloud")
                        .font(.caption2)
                        .foregroundStyle(.blue)
                }

                if let status, let lastRun = status.lastRunAt {
                    Label(lastRun.formatted(.relative(presentation: .named)), systemImage: "clock")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }

                if let status, status.alertsGenerated > 0 {
                    Label("\(status.alertsGenerated) alerts", systemImage: "bell.badge")
                        .font(.caption2)
                        .foregroundStyle(.orange)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct StatusBadge: View {
    let state: PipelineStatus.PipelineState

    var color: Color {
        switch state {
        case .idle: return .secondary
        case .running: return .blue
        case .completed: return .green
        case .failed: return .red
        }
    }

    var body: some View {
        Text(state.rawValue)
            .font(.caption2.bold())
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 2)
            .background(color.opacity(0.15))
            .clipShape(Capsule())
    }
}

#Preview {
    NavigationStack {
        PipelineStatusView()
    }
}
