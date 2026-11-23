import {
	BrainCircuit,
	Check,
	Code2,
	Compass,
	FileJson,
	Leaf,
	Lock,
	PlusCircle,
	Search,
	ShieldCheck,
	X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { AgentRegistry } from "../agents/builtins";
import { AgentCardValidator } from "../sdk/validator";
import type { AgentCard } from "../types/agent-card";

interface DiscoveryHubProps {
	onAgentAdded?: () => void;
}

export const DiscoveryHub: React.FC<DiscoveryHubProps> = ({ onAgentAdded }) => {
	const [agents, setAgents] = useState<AgentCard[]>(AgentRegistry.getAll());
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTag, setSelectedTag] = useState<string>("all");
	const [inspectingCard, setInspectingCard] = useState<AgentCard | null>(null);

	// Import state
	const [importUrl, setImportUrl] = useState("");
	const [importError, setImportError] = useState("");
	const [importSuccess, setImportSuccess] = useState("");

	const allTags = [
		"all",
		"sustainability",
		"privacy",
		"consensus",
		"research",
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

	const handleSimulatedImport = () => {
		setImportError("");
		setImportSuccess("");

		if (!importUrl.trim()) {
			setImportError("Please enter a URL or DID URI.");
			return;
		}

		try {
			// Simulate fetching from /.well-known/agent.json
			const domain = importUrl.replace(/^https?:\/\//, "").split("/")[0];
			const newCard: AgentCard = {
				schemaVersion: "1.0.0",
				id: `did:web:${domain}:agent:custom`,
				name: `${domain.toUpperCase()} Autonomous Agent`,
				version: "1.0.0",
				description: `Discovered live web agent from ${domain} publishing standard capability cards.`,
				icon: "brain-circuit",
				tags: ["custom", "discovered-live", "webmcp"],
				provider: {
					name: `${domain} Webmaster`,
					url: importUrl.startsWith("http") ? importUrl : `https://${domain}`,
				},
				protocols: ["webmcp/1.0", "agent-card/v1"],
				security: {
					sandboxLevel: "isolated",
					reputationScore: 0.95,
					provenance: {
						originUrl: importUrl.startsWith("http")
							? importUrl
							: `https://${domain}/.well-known/agent.json`,
						publishedAt: new Date().toISOString(),
						w3cDid: `did:web:${domain}`,
					},
				},
				capabilities: [
					{
						id: "custom_query",
						name: "Domain Specific Query",
						description: `Interacts with ${domain} web services natively.`,
						inputSchema: {
							type: "object",
							properties: { query: { type: "string" } },
						},
						permissionsRequired: ["network:fetch"],
						pricing: { model: "free" },
					},
				],
			};

			const val = AgentCardValidator.validate(newCard);
			if (!val.isValid) {
				setImportError(`Invalid manifest: ${val.errors.join(", ")}`);
				return;
			}

			AgentRegistry.register(newCard);
			setAgents(AgentRegistry.getAll());
			setImportSuccess(
				`Successfully discovered and registered ${newCard.name} into mesh!`,
			);
			setImportUrl("");
			onAgentAdded?.();
		} catch (err: unknown) {
			setImportError(
				`Discovery failed: ${err instanceof Error ? err.message : String(err)}`,
			);
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
							Decentralized Agent Registry & Discovery Hub
						</h2>
						<p className="text-xs text-slate-400 mt-0.5">
							Query open agents declaring W3C DIDs and{" "}
							<code className="text-cyan-300">/.well-known/agent.json</code>
						</p>
					</div>

					{/* Quick Import Box */}
					<div className="flex items-center gap-2 w-full md:w-auto">
						<input
							type="text"
							value={importUrl}
							onChange={(e) => setImportUrl(e.target.value)}
							placeholder="https://example.org/.well-known/agent.json"
							className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono w-64"
						/>
						<button
							onClick={handleSimulatedImport}
							className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 shrink-0"
						>
							<PlusCircle className="w-3.5 h-3.5" />
							Discover URL
						</button>
					</div>
				</div>

				{importSuccess && (
					<div className="p-2.5 mb-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
						<Check className="w-3.5 h-3.5" />
						{importSuccess}
					</div>
				)}
				{importError && (
					<div className="p-2.5 mb-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-xs text-rose-300 flex items-center gap-2">
						<X className="w-3.5 h-3.5" />
						{importError}
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
