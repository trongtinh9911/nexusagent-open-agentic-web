import {
	Code2,
	Compass,
	Cpu,
	FileCode2,
	Network,
	ShieldAlert,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import type React from "react";
import type { LlmRuntimeConfig } from "./llmConfig";

export type AppTab =
	| "orchestrator"
	| "verifier"
	| "discovery"
	| "studio"
	| "sdk";

interface NavigationProps {
	activeTab: AppTab;
	setActiveTab: (tab: AppTab) => void;
	registeredAgentsCount: number;
	onOpenEmbedModal: () => void;
	llmConfig?: LlmRuntimeConfig;
}

export const Navigation: React.FC<NavigationProps> = ({
	activeTab,
	setActiveTab,
	registeredAgentsCount,
	onOpenEmbedModal,
	llmConfig,
}) => {
	const llmBadgeText =
		!llmConfig || llmConfig.provider === "none"
			? "Keyless Local"
			: llmConfig.provider === "ollama"
				? `Ollama: ${llmConfig.model}`
				: `BYOK RAM: ${llmConfig.provider.toUpperCase()}`;

	return (
		<header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
			{/* Hackathon banner */}
			<div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border-b border-slate-800/80 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2 text-slate-300">
					<span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
					<span className="font-semibold text-emerald-400">
						Open Agentic Web Challenge
					</span>
					<span className="text-slate-500">•</span>
					<span>Cognizant AI Lab × Mozilla × AWS × MIT NANDA</span>
				</div>
				<div className="flex flex-wrap items-center gap-3 text-slate-400">
					<span className="flex items-center gap-1">
						<Cpu className="w-3.5 h-3.5 text-cyan-400" /> {llmBadgeText}
					</span>
					<span className="flex items-center gap-1">
						<ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> Mozilla
						Human-In-The-Loop
					</span>
					<span className="text-slate-500">•</span>
					<span className="font-mono text-emerald-400 font-semibold">
						{registeredAgentsCount} Agents Online
					</span>
				</div>
			</div>

			{/* Main navigation */}
			<div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
						<Network className="w-5 h-5" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h1 className="text-base font-bold text-white tracking-wide">
								NexusAgent
							</h1>
							<span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
								v1.0.0 Open Spec
							</span>
						</div>
						<p className="text-xs text-slate-400">
							Decentralized Web Agent Mesh &amp; Verification Protocol
						</p>
					</div>
				</div>

				{/* Tab buttons */}
				<div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
					<button
						onClick={() => setActiveTab("orchestrator")}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
							activeTab === "orchestrator"
								? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
								: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
						}`}
					>
						<Sparkles className="w-3.5 h-3.5" />
						Mesh Orchestrator
					</button>

					<button
						onClick={() => setActiveTab("verifier")}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
							activeTab === "verifier"
								? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
								: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
						}`}
					>
						<ShieldCheck className="w-3.5 h-3.5" />
						Receipt Verifier
					</button>

					<button
						onClick={() => setActiveTab("discovery")}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
							activeTab === "discovery"
								? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
								: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
						}`}
					>
						<Compass className="w-3.5 h-3.5" />
						Discovery Hub
					</button>

					<button
						onClick={() => setActiveTab("studio")}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
							activeTab === "studio"
								? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
								: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
						}`}
					>
						<FileCode2 className="w-3.5 h-3.5" />
						Manifest Studio
					</button>

					<button
						onClick={() => setActiveTab("sdk")}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
							activeTab === "sdk"
								? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
								: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
						}`}
					>
						<Code2 className="w-3.5 h-3.5" />
						Embed &amp; Spec
					</button>
				</div>

				<div>
					<button
						onClick={onOpenEmbedModal}
						className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5"
					>
						<Code2 className="w-3.5 h-3.5 text-cyan-400" />
						Agentify Your Website
					</button>
				</div>
			</div>
		</header>
	);
};
