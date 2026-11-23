import {
	BrainCircuit,
	Check,
	Code2,
	Compass,
	FileJson,
	Globe,
	Leaf,
	Lock,
	PlusCircle,
	Radio,
	RefreshCw,
	Search,
	ShieldCheck,
	WifiOff,
	X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { AgentRegistry } from "../agents/builtins";
import type { AgentCard } from "../types/agent-card";
import {
	discoverLiveManifest,
	type ManifestDiscoveryResult,
	SELF_MANIFEST_PATH,
} from "./discoverManifest";

interface DiscoveryHubProps {
	onAgentAdded?: () => void;
}

export const DiscoveryHub: React.FC<DiscoveryHubProps> = ({ onAgentAdded }) => {
	const [agents, setAgents] = useState<AgentCard[]>(AgentRegistry.getAll());
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTag, setSelectedTag] = useState<string>("all");
	const [inspectingCard, setInspectingCard] = useState<AgentCard | null>(null);

	// Import / live discovery state
	const [importUrl, setImportUrl] = useState("");
	const [isDiscoveringSelf, setIsDiscoveringSelf] = useState(false);
	const [isDiscoveringUrl, setIsDiscoveringUrl] = useState(false);
	const [discoveryResult, setDiscoveryResult] =
		useState<ManifestDiscoveryResult | null>(null);

	const allTags = [
		"all",
		"sustainability",
		"privacy",
		"consensus",
		"research",
		"orchestrator",
		"mozilla-standard",
		"mit-nanda",
	];

	const filteredAgents = agents.filter((agent) => {
		const matchesSearch =
			agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			agent.id.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesTag =
			selectedTag === "all" || agent.tags.includes(selectedTag);

		return matchesSearch && matchesTag;
	});

	const handleDiscoverSelfManifest = async () => {
		setIsDiscoveringSelf(true);
		setDiscoveryResult(null);
		try {
			const res = await discoverLiveManifest(SELF_MANIFEST_PATH, {
				allowCorsFallback: false,
			});
			setDiscoveryResult(res);
			if (res.ok) {
				setAgents(AgentRegistry.getAll());
				onAgentAdded?.();
			}
		} finally {
			setIsDiscoveringSelf(false);
		}
	};

	const handleDiscoverUrl = async () => {
		setDiscoveryResult(null);
		if (!importUrl.trim()) {
			setDiscoveryResult({
				ok: false,
				mode: "CORS FALLBACK",
				url: "",
				latencyMs: 0,
				error: "Please enter a URL or /.well-known/agent.json endpoint.",
				notice: "No URL provided.",
			});
			return;
		}

		setIsDiscoveringUrl(true);
		try {
			const res = await discoverLiveManifest(importUrl, {
				allowCorsFallback: true,
			});
			setDiscoveryResult(res);
			if (res.ok) {
				setAgents(AgentRegistry.getAll());
				setImportUrl("");
				onAgentAdded?.();
			}
		} finally {
			setIsDiscoveringUrl(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Search and Discovery header */}
			<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
				<div className="flex flex-wrap items-center justify-between gap-4 mb-4">
					<div>
						<h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
							<Compass className="w-4 h-4 text-emerald-400" />
							Decentralized Agent Registry &amp; Discovery Hub
						</h2>
						<p className="text-xs text-slate-400 mt-0.5">
							Query open agents declaring W3C DIDs and{" "}
							<code className="text-cyan-300">/.well-known/agent.json</code>
						</p>
					</div>

					{/* 1-Click Self-Manifest + URL Discovery Controls */}
					<div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
						<button
							onClick={handleDiscoverSelfManifest}
							disabled={isDiscoveringSelf}
							className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shrink-0 shadow-sm"
						>
							{isDiscoveringSelf ? (
								<RefreshCw className="w-3.5 h-3.5 animate-spin" />
							) : (
								<Radio className="w-3.5 h-3.5" />
							)}
							Discover Live Self-Manifest
						</button>

						<input
							type="text"
							value={importUrl}
							onChange={(e) => setImportUrl(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleDiscoverUrl()}
							placeholder="https://example.org/.well-known/agent.json"
							className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono w-64"
						/>
						<button
							onClick={handleDiscoverUrl}
							disabled={isDiscoveringUrl}
							className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 shrink-0"
						>
							{isDiscoveringUrl ? (
								<RefreshCw className="w-3.5 h-3.5 animate-spin" />
							) : (
								<PlusCircle className="w-3.5 h-3.5" />
							)}
							Discover URL
						</button>
					</div>
				</div>

				{/* Live Discovery Outcome Banner */}
				{discoveryResult && (
					<div
						className={`p-3 mb-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 ${
							discoveryResult.ok
								? discoveryResult.mode === "LIVE NETWORK FETCH"
									? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
									: "bg-amber-950/35 border-amber-500/40 text-amber-200"
								: "bg-rose-950/40 border-rose-500/40 text-rose-200"
						}`}
					>
						<div className="flex items-center gap-2">
							{discoveryResult.ok ? (
								<Check className="w-4 h-4 shrink-0" />
							) : (
								<X className="w-4 h-4 shrink-0" />
							)}
							<span className="font-mono text-[11px]">
								{discoveryResult.ok
									? discoveryResult.notice
									: discoveryResult.error || discoveryResult.notice}
							</span>
						</div>

						<div className="flex items-center gap-2 shrink-0">
							<span
								className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border flex items-center gap-1 ${
									discoveryResult.mode === "LIVE NETWORK FETCH"
										? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
										: "bg-amber-500/20 text-amber-300 border-amber-500/40"
								}`}
							>
								{discoveryResult.mode === "LIVE NETWORK FETCH" ? (
									<Globe className="w-3 h-3" />
								) : (
									<WifiOff className="w-3 h-3" />
								)}
								{discoveryResult.mode}
							</span>
							{discoveryResult.card && (
								<button
									onClick={() =>
										setInspectingCard(discoveryResult.card || null)
									}
									className="text-[11px] underline text-cyan-300 hover:text-cyan-200"
								>
									Inspect JSON
								</button>
							)}
						</div>
					</div>
				)}

				{/* Filter bar */}
				<div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
					<div className="relative flex-1 min-w-[200px]">
						<Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by agent name, capability, or DID..."
							className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
						/>
					</div>

					<div className="flex items-center gap-1.5 overflow-x-auto py-1">
						{allTags.map((tag) => (
							<button
								key={tag}
								onClick={() => setSelectedTag(tag)}
								className={`text-[11px] px-2.5 py-1 rounded-md capitalize font-medium transition ${
									selectedTag === tag
										? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
										: "bg-slate-800 text-slate-400 hover:text-slate-200"
								}`}
							>
								{tag}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Agents Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{filteredAgents.map((agent) => (
					<div
						key={agent.id}
						className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg transition flex flex-col justify-between"
					>
						<div>
							{/* Header */}
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 shrink-0">
										{agent.tags.includes("sustainability") ? (
											<Leaf className="w-5 h-5" />
										) : agent.tags.includes("privacy") ? (
											<Lock className="w-5 h-5 text-amber-400" />
										) : agent.tags.includes("consensus") ? (
											<ShieldCheck className="w-5 h-5 text-cyan-400" />
										) : (
											<BrainCircuit className="w-5 h-5" />
										)}
									</div>
									<div>
										<h3 className="text-sm font-bold text-white">
											{agent.name}
										</h3>
										<span
											className="text-[10px] font-mono text-slate-500 block truncate max-w-[220px]"
											title={agent.id}
										>
											{agent.id}
										</span>
									</div>
								</div>

								<div className="text-right">
									<span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold block">
										{Math.round((agent.security.reputationScore || 0.95) * 100)}
										% Trust
									</span>
									<span className="text-[9px] text-slate-500 font-mono block mt-0.5">
										{agent.security.sandboxLevel}
									</span>
								</div>
							</div>

							{/* Description */}
							<p className="text-xs text-slate-300 mt-3 line-clamp-2">
								{agent.description}
							</p>

							{/* Capabilities */}
							<div className="mt-4 space-y-1.5">
								<span className="text-[10px] uppercase font-mono text-slate-500 block">
									Exposed Capabilities:
								</span>
								{agent.capabilities.map((cap) => (
									<div
										key={cap.id}
										className="p-2 rounded bg-slate-950/70 border border-slate-800/80 text-xs flex items-center justify-between gap-2"
									>
										<div>
											<span className="font-semibold text-slate-200">
												{cap.name}
											</span>
											<span className="text-slate-500 text-[10px] block">
												{cap.description}
											</span>
										</div>
										<div className="flex gap-1 shrink-0">
											{cap.permissionsRequired.map((p) => (
												<span
													key={p}
													className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-800 text-slate-400"
												>
													{p.split(":")[1]}
												</span>
											))}
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Footer */}
						<div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
							<span className="text-slate-500 text-[11px] truncate max-w-[180px]">
								By {agent.provider.name}
							</span>
							<button
								onClick={() => setInspectingCard(agent)}
								className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition"
							>
								<FileJson className="w-3.5 h-3.5" />
								Inspect Manifest
							</button>
						</div>
					</div>
				))}
			</div>

			{/* Inspect Raw Manifest Modal */}
			{inspectingCard && (
				<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
					<div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
						<div className="flex items-center justify-between pb-3 border-b border-slate-800">
							<div className="flex items-center gap-2">
								<Code2 className="w-4 h-4 text-emerald-400" />
								<h3 className="text-sm font-bold text-white">
									Manifest: {inspectingCard.name}
								</h3>
							</div>
							<button
								onClick={() => setInspectingCard(null)}
								className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
							>
								<X className="w-5 h-5" />
							</button>
						</div>
						<pre className="mt-4 bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 overflow-y-auto flex-1">
							{JSON.stringify(inspectingCard, null, 2)}
						</pre>
						<div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
							<button
								onClick={() => setInspectingCard(null)}
								className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
