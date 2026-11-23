import {
	CheckCircle2,
	Cpu,
	KeyRound,
	Lock,
	RefreshCw,
	Sliders,
	Trash2,
	WifiOff,
	XCircle,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
	clearRamLlmSecrets,
	isLlmActive,
	type LlmProvider,
	type LlmRuntimeConfig,
	type LlmTestResult,
	PROVIDER_DEFAULTS,
	setRamLlmConfig,
	testLlmConnection,
} from "./llmConfig";

interface LlmSettingsPanelProps {
	config: LlmRuntimeConfig;
	onChange: (next: LlmRuntimeConfig) => void;
}

const PROVIDERS: LlmProvider[] = [
	"none",
	"ollama",
	"openai",
	"gemini",
	"anthropic",
];

export const LlmSettingsPanel: React.FC<LlmSettingsPanelProps> = ({
	config,
	onChange,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isTesting, setIsTesting] = useState(false);
	const [testResult, setTestResult] = useState<LlmTestResult | null>(null);

	const active = isLlmActive(config);
	const meta = PROVIDER_DEFAULTS[config.provider];

	const handleProviderSelect = (provider: LlmProvider) => {
		const defaults = PROVIDER_DEFAULTS[provider];
		const updated = setRamLlmConfig({
			provider,
			apiKey: provider === config.provider ? config.apiKey : "",
			endpoint: defaults.endpoint,
			model: defaults.model,
		});
		setTestResult(null);
		onChange(updated);
	};

	const handleFieldUpdate = (patch: Partial<LlmRuntimeConfig>) => {
		const updated = setRamLlmConfig({ ...config, ...patch });
		setTestResult(null);
		onChange(updated);
	};

	const handleClearRam = () => {
		const cleared = clearRamLlmSecrets();
		setTestResult(null);
		onChange(cleared);
	};

	const handleTestConnection = async () => {
		setIsTesting(true);
		try {
			const res = await testLlmConnection(config);
			setTestResult(res);
		} finally {
			setIsTesting(false);
		}
	};

	return (
		<div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
			{/* Compact Header Bar */}
			<div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2.5">
					<div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
						<Cpu className="w-4 h-4" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<span className="text-xs font-bold text-white uppercase tracking-wider">
								Optional BYOK / Local Ollama LLM Engine
							</span>
							<span
								className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold border ${
									active
										? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
										: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
								}`}
							>
								{config.provider === "none"
									? "KEYLESS DEFAULT (0 API KEYS)"
									: config.provider === "ollama"
										? `LOCAL OLLAMA (${config.model})`
										: `BYOK RAM-ONLY (${config.provider.toUpperCase()})`}
							</span>
						</div>
						<p className="text-[11px] text-slate-400">
							Default runs 100% keyless in-browser. Optional API keys live in
							browser RAM only (never written to localStorage, cookies, or any
							server).
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{active && (
						<button
							onClick={handleClearRam}
							className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition flex items-center gap-1"
							title="Wipe API key from browser memory immediately"
						>
							<Trash2 className="w-3 h-3" />
							Wipe RAM Key
						</button>
					)}
					<button
						onClick={() => setIsExpanded((prev) => !prev)}
						className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
					>
						<Sliders className="w-3.5 h-3.5 text-cyan-400" />
						{isExpanded ? "Hide LLM Settings" : "Configure BYOK / Ollama"}
					</button>
				</div>
			</div>

			{/* Expanded Settings Drawer */}
			{isExpanded && (
				<div className="px-5 pb-5 pt-4 border-t border-slate-800 space-y-4 bg-slate-950/50">
					{/* Security Guarantee Banner */}
					<div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-center gap-2">
						<Lock className="w-3.5 h-3.5 shrink-0" />
						<span>
							<strong>RAM-Only Privacy Guarantee:</strong> Keys are held solely
							in volatile JavaScript heap memory and automatically destroyed on
							page refresh. No proxy servers, no localStorage, no telemetry.
						</span>
					</div>

					{/* Provider Selector Pills */}
					<div>
						<span className="text-[10px] font-mono uppercase text-slate-500 block mb-2">
							Select Synthesis Runtime:
						</span>
						<div className="flex flex-wrap gap-2">
							{PROVIDERS.map((p) => {
								const isSelected = config.provider === p;
								return (
									<button
										key={p}
										onClick={() => handleProviderSelect(p)}
										className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
											isSelected
												? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-semibold"
												: "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
										}`}
									>
										{PROVIDER_DEFAULTS[p].label}
									</button>
								);
							})}
						</div>
					</div>

					{/* Provider-specific fields */}
					{config.provider !== "none" && (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							<div>
								<label
									htmlFor="llm-endpoint-input"
									className="text-[10px] font-mono uppercase text-slate-400 block mb-1"
								>
									{config.provider === "ollama"
										? "Local Ollama Base URL"
										: "Direct API Endpoint"}
								</label>
								<input
									id="llm-endpoint-input"
									type="text"
									value={config.endpoint}
									onChange={(e) =>
										handleFieldUpdate({ endpoint: e.target.value })
									}
									placeholder={meta.endpoint}
									className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
								/>
							</div>

							<div>
								<label
									htmlFor="llm-model-input"
									className="text-[10px] font-mono uppercase text-slate-400 block mb-1"
								>
									Model Identifier
								</label>
								<input
									id="llm-model-input"
									type="text"
									value={config.model}
									onChange={(e) => handleFieldUpdate({ model: e.target.value })}
									placeholder={meta.model}
									className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
								/>
							</div>

							{meta.requiresKey ? (
								<div>
									<label
										htmlFor="llm-apikey-input"
										className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1 mb-1"
									>
										<KeyRound className="w-3 h-3 text-amber-400" />
										API Key (RAM Only)
									</label>
									<input
										id="llm-apikey-input"
										type="password"
										autoComplete="off"
										value={config.apiKey}
										onChange={(e) =>
											handleFieldUpdate({ apiKey: e.target.value })
										}
										placeholder="sk-... (never persisted)"
										className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-amber-200 font-mono focus:outline-none"
									/>
								</div>
							) : (
								<div className="flex items-end">
									<div className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
										<WifiOff className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
										<span>No cloud API key needed — runs 100% locally.</span>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Test button & result */}
					<div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
						<div className="flex items-center gap-2">
							<button
								onClick={handleTestConnection}
								disabled={isTesting}
								className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5"
							>
								<RefreshCw
									className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`}
								/>
								{config.provider === "ollama"
									? "Probe Local Ollama (/api/tags)"
									: "Verify Runtime Config"}
							</button>

							{config.provider !== "none" && (
								<button
									onClick={handleClearRam}
									className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
								>
									Reset to Keyless Default
								</button>
							)}
						</div>

						{testResult && (
							<div
								className={`text-xs flex items-center gap-1.5 font-mono ${
									testResult.ok ? "text-emerald-300" : "text-amber-300"
								}`}
							>
								{testResult.ok ? (
									<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
								) : (
									<XCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
								)}
								<span>{testResult.message}</span>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
