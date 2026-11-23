import { Check, Copy, Globe, Sparkles, X } from "lucide-react";
import React from "react";

interface EmbedCodeModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const EmbedCodeModal: React.FC<EmbedCodeModalProps> = ({
	isOpen,
	onClose,
}) => {
	const [copiedStep1, setCopiedStep1] = React.useState(false);
	const [copiedStep2, setCopiedStep2] = React.useState(false);

	if (!isOpen) return null;

	const htmlSnippet = `<!-- 1. Declare Open Agentic Capability in your Website <head> -->
<link rel="agent-manifest" type="application/json" href="/.well-known/agent.json" />

<!-- 2. Embed In-Browser WebMCP Autonomous Gateway (0 server telemetry) -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@open-agentic-web/mesh@1.0.0/dist/gateway.js" async></script>`;

	const agentJsonSnippet = `{
  "schemaVersion": "1.0.0",
  "id": "did:web:yourdomain.com",
  "name": "Your Website Open Agent",
  "version": "1.0.0",
  "description": "Exposes structured query, purchase, and calculation tools to autonomous web agents.",
  "protocols": ["webmcp/1.0", "nanda/0.2", "w3c-did/v1"],
  "capabilities": [
    {
      "id": "query_inventory",
      "name": "Query Products",
      "description": "Allows search agents to discover live catalog items.",
      "inputSchema": { "type": "object", "properties": { "query": { "type": "string" } } },
      "permissionsRequired": ["network:fetch"]
    }
  ]
}`;

	return (
		<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-slate-900 border border-cyan-500/40 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative glow-cyan max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex items-start justify-between pb-4 border-b border-slate-800">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
							<Globe className="w-5 h-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="text-base font-bold text-white">
									Agentify Your Website in 30 Seconds
								</h3>
								<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
									Open Standard
								</span>
							</div>
							<p className="text-xs text-slate-400 mt-0.5">
								Join the decentralized agent economy without proprietary app
								store gatekeepers.
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Instructions */}
				<div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
					{/* Step 1 */}
					<div>
						<div className="flex items-center justify-between mb-1.5">
							<span className="font-semibold text-white flex items-center gap-2">
								<span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center text-[10px]">
									1
								</span>
								Publish{" "}
								<code className="text-cyan-300">/.well-known/agent.json</code>{" "}
								on your web server:
							</span>
							<button
								onClick={() => {
									navigator.clipboard.writeText(agentJsonSnippet);
									setCopiedStep1(true);
									setTimeout(() => setCopiedStep1(false), 2000);
								}}
								className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded"
							>
								{copiedStep1 ? (
									<Check className="w-3 h-3 text-emerald-400" />
								) : (
									<Copy className="w-3 h-3" />
								)}
								Copy Manifest
							</button>
						</div>
						<pre className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-40">
							{agentJsonSnippet}
						</pre>
					</div>

					{/* Step 2 */}
					<div>
						<div className="flex items-center justify-between mb-1.5">
							<span className="font-semibold text-white flex items-center gap-2">
								<span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center text-[10px]">
									2
								</span>
								Add discovery tag to your HTML{" "}
								<code className="text-cyan-300">&lt;head&gt;</code>:
							</span>
							<button
								onClick={() => {
									navigator.clipboard.writeText(htmlSnippet);
									setCopiedStep2(true);
									setTimeout(() => setCopiedStep2(false), 2000);
								}}
								className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded"
							>
								{copiedStep2 ? (
									<Check className="w-3 h-3 text-emerald-400" />
								) : (
									<Copy className="w-3 h-3" />
								)}
								Copy HTML Snippet
							</button>
						</div>
						<pre className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 font-mono text-[11px] text-emerald-300 overflow-x-auto">
							{htmlSnippet}
						</pre>
					</div>

					<div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-3 text-[11px] text-emerald-300 flex items-start gap-2.5">
						<Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
						<div>
							<p className="font-semibold">
								Zero Centralized Lock-in Guarantee
							</p>
							<p className="text-slate-400 mt-0.5">
								Any autonomous AI agent running in Firefox, Chrome, Brave, or
								server-side can now discover and invoke your services directly
								using W3C DID cryptographic verification and WebMCP protocol
								standards.
							</p>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
					<button
						onClick={onClose}
						className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
					>
						Close Guide
					</button>
				</div>
			</div>
		</div>
	);
};
