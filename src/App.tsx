import { BookOpen, Cpu, Network, Shield } from "lucide-react";
import { useRef, useState } from "react";
import { AgentRegistry } from "./agents/builtins";
import { DiscoveryHub } from "./components/DiscoveryHub";
import { EmbedCodeModal } from "./components/EmbedCodeModal";
import { ExecutionReceiptModal } from "./components/ExecutionReceiptModal";
import { getRamLlmConfig, type LlmRuntimeConfig } from "./components/llmConfig";
import { ManifestStudio } from "./components/ManifestStudio";
import { MeshOrchestratorView } from "./components/MeshOrchestratorView";
import { type AppTab, Navigation } from "./components/Navigation";
import { ReceiptVerifierView } from "./components/ReceiptVerifierView";
import { SecurityGateModal } from "./components/SecurityGateModal";
import { PermissionController } from "./sdk/permissions";
import type { VerifiableReceipt } from "./types/mesh";
import type { PermissionDecision, PermissionRequest } from "./types/security";

export function App() {
	const [activeTab, setActiveTab] = useState<AppTab>("orchestrator");
	const [activeReceipt, setActiveReceipt] = useState<VerifiableReceipt | null>(
		null,
	);
	const [latestMeshReceipt, setLatestMeshReceipt] =
		useState<VerifiableReceipt | null>(null);
	const [verifierSeedReceipt, setVerifierSeedReceipt] =
		useState<VerifiableReceipt | null>(null);
	const [llmConfig, setLlmConfig] = useState<LlmRuntimeConfig>(() =>
		getRamLlmConfig(),
	);
	const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
	const [registeredCount, setRegisteredCount] = useState(
		AgentRegistry.getAll().length,
	);

	// Permission request state
	const [pendingPermissionRequest, setPendingPermissionRequest] =
		useState<PermissionRequest | null>(null);
	const permissionResolverRef = useRef<
		((decision: PermissionDecision) => void) | null
	>(null);

	// Instantiate singleton PermissionController
	const [permissionController] = useState<PermissionController>(() => {
		const pc = new PermissionController();
		pc.setPromptCallback((req: PermissionRequest) => {
			return new Promise<PermissionDecision>((resolve) => {
				setPendingPermissionRequest(req);
				permissionResolverRef.current = resolve;
			});
		});
		return pc;
	});

	const handleDecision = (decision: PermissionDecision) => {
		if (permissionResolverRef.current) {
			permissionResolverRef.current(decision);
			permissionResolverRef.current = null;
		}
		setPendingPermissionRequest(null);
	};

	const handleRefreshAgentsCount = () => {
		setRegisteredCount(AgentRegistry.getAll().length);
	};

	const handleJumpToVerifier = (receipt: VerifiableReceipt) => {
		setVerifierSeedReceipt(receipt);
		setActiveTab("verifier");
	};

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
			{/* Top Header */}
			<Navigation
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				registeredAgentsCount={registeredCount}
				onOpenEmbedModal={() => setIsEmbedModalOpen(true)}
				llmConfig={llmConfig}
			/>

			{/* Main Content Area */}
			<main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
				{activeTab === "orchestrator" && (
					<MeshOrchestratorView
						permissionController={permissionController}
						onOpenReceipt={(r) => setActiveReceipt(r)}
						onVerifyReceipt={handleJumpToVerifier}
						onReceiptGenerated={(r) => setLatestMeshReceipt(r)}
						llmConfig={llmConfig}
						onLlmConfigChange={setLlmConfig}
					/>
				)}

				{activeTab === "verifier" && (
					<ReceiptVerifierView
						initialReceipt={verifierSeedReceipt}
						latestMeshReceipt={latestMeshReceipt}
					/>
				)}

				{activeTab === "discovery" && (
					<DiscoveryHub onAgentAdded={handleRefreshAgentsCount} />
				)}

				{activeTab === "studio" && (
					<ManifestStudio onAgentRegistered={handleRefreshAgentsCount} />
				)}

				{activeTab === "sdk" && (
					<div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
						<div>
							<h2 className="text-lg font-bold text-white flex items-center gap-2">
								<BookOpen className="w-5 h-5 text-cyan-400" />
								Open Agentic Web Specification &amp; SDK Reference
							</h2>
							<p className="text-xs text-slate-400 mt-1">
								Formal specification submitted to the Open Agentic Web Challenge
								(Cognizant AI Lab, Mozilla, AWS, MIT Media Lab NANDA).
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
								<div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
									<Network className="w-4 h-4" />
									<span>1. Agent Card v1.0</span>
								</div>
								<p className="text-xs text-slate-400">
									Every website exposes a machine-readable{" "}
									<code className="text-emerald-300">
										/.well-known/agent.json
									</code>{" "}
									manifest with capabilities, schemas, and W3C DIDs.
								</p>
							</div>

							<div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
								<div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm mb-2">
									<Cpu className="w-4 h-4" />
									<span>2. In-Browser WebMCP</span>
								</div>
								<p className="text-xs text-slate-400">
									Browser-native Model Context Protocol. AI agents run securely
									inside local Web Workers and iframes with zero centralized
									cloud dependencies.
								</p>
							</div>

							<div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
								<div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-2">
									<Shield className="w-4 h-4" />
									<span>3. Mozilla Human Gate</span>
								</div>
								<p className="text-xs text-slate-400">
									Total user sovereignty. Agents cannot read DOM, cookies, or
									make network calls without explicit, transparent user
									authorization.
								</p>
							</div>
						</div>

						{/* Architecture diagram code block */}
						<div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
							<span className="text-slate-500 uppercase block mb-2 text-[10px]">
								v2.1.0 Live Cross-Origin Peer Mesh &amp; Topological DAG:
							</span>
							<pre className="text-cyan-300 leading-relaxed">
								{`User Prompt ──> Intent Planner ──> Dynamic DAG Compilation
                     │
          Cross-Origin CORS HTTPS Peer Mesh (trongtinh9911.github.io/nexusagent-peer-nodes)
         ┌───────────┴───────────┐
         ▼                       ▼
Stage 1: Intelligence    Stage 2: Parallel Audits
(webresearcher/index.json) (ecotracker/telemetry.json + privacyshield/audit-rules.json)
         │                       │
         └───────────┬───────────┘
                     ▼
Stage 3: Consensus & Veracity Certification (truthmesh/consensus.json)
                     │
                     ▼
Cryptographic Merkle Proof & Verifiable Execution Receipt`}
							</pre>
						</div>
					</div>
				)}
			</main>

			{/* Footer */}
			<footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
				<div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-emerald-400" />
						<span className="font-semibold text-slate-300">
							NexusAgent Open Agentic Mesh
						</span>
						<span>—</span>
						<span>MIT License • Open Source for Social Good</span>
					</div>
					<div className="flex items-center gap-4 text-slate-400">
						<span>Cognizant AI Lab</span>
						<span>•</span>
						<span>Mozilla Otari &amp; Privacy</span>
						<span>•</span>
						<span>MIT Media Lab NANDA</span>
						<span>•</span>
						<span>AWS Agentic Cloud</span>
					</div>
				</div>
			</footer>

			{/* Modals */}
			<SecurityGateModal
				request={pendingPermissionRequest}
				onDecision={handleDecision}
			/>

			<ExecutionReceiptModal
				receipt={activeReceipt}
				onClose={() => setActiveReceipt(null)}
				onOpenVerifier={handleJumpToVerifier}
			/>

			<EmbedCodeModal
				isOpen={isEmbedModalOpen}
				onClose={() => setIsEmbedModalOpen(false)}
			/>
		</div>
	);
}
