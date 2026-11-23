import {
	AlertCircle,
	Check,
	Cpu,
	Download,
	FileCode2,
	KeyRound,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { AgentRegistry } from "../agents/builtins";
import { AgentCrypto } from "../sdk/crypto";
import { AgentCardValidator, type ValidationResult } from "../sdk/validator";
import type { AgentCard } from "../types/agent-card";

interface ManifestStudioProps {
	onAgentRegistered?: () => void;
}

export const ManifestStudio: React.FC<ManifestStudioProps> = ({
	onAgentRegistered,
}) => {
	const defaultManifest: AgentCard = {
		schemaVersion: "1.0.0",
		id: "did:web:my-community-service.org",
		name: "Community Food Security Agent",
		version: "1.0.0",
		description:
			"Matches local food surplus donors with non-profit shelters using decentralized routing.",
		tags: ["social-good", "un-sdg-zero-hunger", "community", "nanda"],
		provider: {
			name: "Open Food Rescue Network",
			url: "https://food-rescue.org",
			contact: "contact@food-rescue.org",
		},
		protocols: ["webmcp/1.0", "nanda/0.2", "w3c-did/v1", "agent-card/v1"],
		security: {
			sandboxLevel: "isolated",
			didPublicKey: "did:key:z6MkqExample...",
			reputationScore: 0.95,
			provenance: {
				originUrl: "https://food-rescue.org/.well-known/agent.json",
				publishedAt: new Date().toISOString(),
				w3cDid: "did:web:food-rescue.org",
			},
		},
		capabilities: [
			{
				id: "match_donations",
				name: "Match Food Donations",
				description:
					"Finds the nearest shelter needing immediate perishable items.",
				inputSchema: {
					type: "object",
					properties: {
						zipCode: { type: "string" },
						perishableItemsCount: { type: "number" },
					},
					required: ["zipCode"],
				},
				permissionsRequired: ["network:fetch"],
				pricing: { model: "free" },
			},
		],
	};

	const [jsonText, setJsonText] = useState<string>(
		JSON.stringify(defaultManifest, null, 2),
	);
	const [validation, setValidation] = useState<ValidationResult>(
		AgentCardValidator.validate(defaultManifest),
	);
	const [registerSuccess, setRegisterSuccess] = useState<string>("");

	const handleTextChange = (text: string) => {
		setJsonText(text);
		setRegisterSuccess("");
		try {
			const parsed = JSON.parse(text);
			const res = AgentCardValidator.validate(parsed);
			setValidation(res);
		} catch {
			setValidation({
				isValid: false,
				errors: ["SyntaxError: Invalid JSON format."],
				warnings: [],
			});
		}
	};

	const handleGenerateDidKey = async () => {
		try {
			const parsed = JSON.parse(jsonText);
			const randomSeed = Math.random().toString(36).slice(2, 10);
			const didKey = `did:key:z6M${await AgentCrypto.sha256(randomSeed).then((h) => h.slice(0, 32))}`;
			parsed.security = {
				...(parsed.security || {}),
				didPublicKey: didKey,
				provenance: {
					...(parsed.security?.provenance || {}),
					w3cDid: parsed.id,
				},
			};
			const formatted = JSON.stringify(parsed, null, 2);
			setJsonText(formatted);
			setValidation(AgentCardValidator.validate(parsed));
		} catch {
			// ignore
		}
	};

	const handleRegisterToMesh = () => {
		try {
			const parsed = JSON.parse(jsonText) as AgentCard;
			const res = AgentCardValidator.validate(parsed);
			if (!res.isValid) return;

			AgentRegistry.register(parsed);
			setRegisterSuccess(
				`Registered '${parsed.name}' into active in-browser WebMCP mesh!`,
			);
			onAgentRegistered?.();
		} catch {
			// ignore
		}
	};

	const handleDownload = () => {
		const blob = new Blob([jsonText], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "agent.json";
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
				<div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
					<div>
						<h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
							<FileCode2 className="w-4 h-4 text-cyan-400" />
							Agent Manifest Studio & Schema Validator
						</h2>
						<p className="text-xs text-slate-400 mt-0.5">
							Author, cryptographically sign, and test your website's{" "}
							<code className="text-emerald-300">/.well-known/agent.json</code>
						</p>
					</div>

					<div className="flex items-center gap-2">
						<button
							onClick={handleGenerateDidKey}
							className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
						>
							<KeyRound className="w-3.5 h-3.5 text-amber-400" />
							Generate W3C DID Key
						</button>

						<button
							onClick={handleDownload}
							className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
						>
							<Download className="w-3.5 h-3.5 text-cyan-400" />
							Export agent.json
						</button>

						<button
							onClick={handleRegisterToMesh}
							disabled={!validation.isValid}
							className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
								validation.isValid
									? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm"
									: "bg-slate-800 text-slate-600 cursor-not-allowed"
							}`}
						>
							<Cpu className="w-3.5 h-3.5" />
							Register into Mesh
						</button>
					</div>
				</div>

				{registerSuccess && (
					<div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
						<Check className="w-4 h-4" />
						{registerSuccess}
					</div>
				)}

				{/* Validation status badge */}
				<div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
					<div className="flex items-center gap-2">
						{validation.isValid ? (
							<>
								<Check className="w-4 h-4 text-emerald-400" />
								<span className="text-emerald-400 font-semibold">
									Schema Compliant (Open Agent Card v1.0.0)
								</span>
							</>
						) : (
							<>
								<AlertCircle className="w-4 h-4 text-rose-400" />
								<span className="text-rose-400 font-semibold">
									Schema Violations Detected
								</span>
							</>
						)}
					</div>
					<span className="text-slate-500 text-[11px]">
						{validation.errors.length} errors, {validation.warnings.length}{" "}
						warnings
					</span>
				</div>

				{/* Errors list */}
				{validation.errors.length > 0 && (
					<div className="mt-2 p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs text-rose-300 space-y-1 font-mono">
						{validation.errors.map((err, i) => (
							<div key={i} className="flex items-start gap-2">
								<span className="text-rose-500">•</span>
								<span>{err}</span>
							</div>
						))}
					</div>
				)}

				{/* Editor */}
				<div className="mt-4">
					<textarea
						value={jsonText}
						onChange={(e) => handleTextChange(e.target.value)}
						rows={18}
						className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-4 font-mono text-xs text-slate-200 focus:outline-none transition leading-relaxed"
						spellCheck={false}
					/>
				</div>
			</div>
		</div>
	);
};
