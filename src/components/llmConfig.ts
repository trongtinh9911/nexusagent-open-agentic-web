import { type LLMConfig, LocalLLMService } from "../sdk/llm-provider";

export type LlmProvider = "none" | "ollama" | "openai" | "anthropic" | "gemini";

export interface LlmRuntimeConfig {
	provider: LlmProvider;
	/** Kept strictly in browser JS heap (RAM only). Never persisted to localStorage, sessionStorage, or cookies. */
	apiKey: string;
	endpoint: string;
	model: string;
}

export interface LlmTestResult {
	ok: boolean;
	message: string;
	availableModels?: string[];
	latencyMs: number;
}

export const DEFAULT_LLM_CONFIG: LlmRuntimeConfig = {
	provider: "none",
	apiKey: "",
	endpoint: "http://localhost:11434",
	model: "llama3.2",
};

export const PROVIDER_DEFAULTS: Record<
	LlmProvider,
	{ label: string; endpoint: string; model: string; requiresKey: boolean }
> = {
	none: {
		label: "Keyless Deterministic Engine (Default)",
		endpoint: "",
		model: "mesh-v1-deterministic",
		requiresKey: false,
	},
	ollama: {
		label: "Local Ollama (Zero-Cloud RAM)",
		endpoint: "http://localhost:11434",
		model: "llama3.2:1b",
		requiresKey: false,
	},
	openai: {
		label: "OpenAI (BYOK - RAM Only)",
		endpoint: "https://api.openai.com/v1/chat/completions",
		model: "gpt-4o-mini",
		requiresKey: true,
	},
	gemini: {
		label: "Google Gemini (BYOK - RAM Only)",
		endpoint:
			"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
		model: "gemini-2.0-flash",
		requiresKey: true,
	},
	anthropic: {
		label: "Anthropic Claude (BYOK - RAM Only)",
		endpoint: "https://api.anthropic.com/v1/messages",
		model: "claude-3-5-haiku-latest",
		requiresKey: true,
	},
};

/**
 * In-memory runtime store (RAM only, zero Web Storage persistence).
 */
let ramLlmConfig: LlmRuntimeConfig = { ...DEFAULT_LLM_CONFIG };

export function getRamLlmConfig(): LlmRuntimeConfig {
	return { ...ramLlmConfig };
}

export function setRamLlmConfig(next: LlmRuntimeConfig): LlmRuntimeConfig {
	ramLlmConfig = {
		provider: next.provider,
		apiKey:
			next.provider === "none" || next.provider === "ollama" ? "" : next.apiKey,
		endpoint: next.endpoint.trim(),
		model: next.model.trim(),
	};
	return { ...ramLlmConfig };
}

export function clearRamLlmSecrets(): LlmRuntimeConfig {
	ramLlmConfig = { ...DEFAULT_LLM_CONFIG };
	return { ...ramLlmConfig };
}

export function isLlmActive(config: LlmRuntimeConfig): boolean {
	if (config.provider === "none") return false;
	if (config.provider === "ollama") return Boolean(config.endpoint.trim());
	return Boolean(config.apiKey.trim());
}

/**
 * Converts UI RAM config into the SDK LLMConfig contract consumed by MeshOrchestrator & LocalLLMService.
 */
export function toSdkLlmConfig(config: LlmRuntimeConfig): LLMConfig {
	if (config.provider === "ollama") {
		return {
			provider: "ollama",
			baseUrl: config.endpoint || "http://localhost:11434",
			modelName: config.model || "llama3.2:1b",
		};
	}
	if (config.provider === "openai" && config.apiKey.trim()) {
		return {
			provider: "byok-openai",
			apiKey: config.apiKey,
			baseUrl: config.endpoint,
			modelName: config.model || "gpt-4o-mini",
		};
	}
	if (config.provider === "gemini" && config.apiKey.trim()) {
		return {
			provider: "byok-gemini",
			apiKey: config.apiKey,
			baseUrl: config.endpoint,
			modelName: config.model || "gemini-2.0-flash",
		};
	}
	return {
		provider: "in-browser-mock",
		modelName: "mesh-v1-deterministic",
	};
}

/**
 * Probes Local Ollama `/api/tags` or validates BYOK readiness without persisting credentials.
 */
export async function testLlmConnection(
	config: LlmRuntimeConfig,
	fetchImpl: typeof fetch = globalThis.fetch,
): Promise<LlmTestResult> {
	const start = performance.now();

	if (config.provider === "none") {
		return {
			ok: true,
			message:
				"Keyless deterministic in-browser WebMCP runtime active (0 API keys required).",
			latencyMs: 0,
		};
	}

	if (config.provider === "ollama") {
		const baseUrl = (config.endpoint || "http://localhost:11434").replace(
			/\/+$/,
			"",
		);
		try {
			const res = await fetchImpl(`${baseUrl}/api/tags`, {
				method: "GET",
				headers: { Accept: "application/json" },
			});
			const latencyMs = Math.round(performance.now() - start);
			if (!res.ok) {
				return {
					ok: false,
					message: `Ollama responded with HTTP ${res.status}. Ensure Ollama is running with OLLAMA_ORIGINS=*`,
					latencyMs,
				};
			}
			const data = (await res.json()) as { models?: { name: string }[] };
			const models = Array.isArray(data.models)
				? data.models.map((m) => m.name)
				: [];
			return {
				ok: true,
				message: `Connected to Local Ollama (${models.length} models detected).`,
				availableModels: models,
				latencyMs,
			};
		} catch (err: unknown) {
			return {
				ok: false,
				message: `Could not reach Local Ollama at ${baseUrl}: ${err instanceof Error ? err.message : String(err)}`,
				latencyMs: Math.round(performance.now() - start),
			};
		}
	}

	if (!config.apiKey.trim()) {
		return {
			ok: false,
			message: `Enter your ${PROVIDER_DEFAULTS[config.provider].label} API key in RAM to enable enhanced synthesis.`,
			latencyMs: 0,
		};
	}

	return {
		ok: true,
		message: `${PROVIDER_DEFAULTS[config.provider].label} key armed in browser RAM only (${config.model}). Never written to disk.`,
		latencyMs: Math.round(performance.now() - start),
	};
}

/**
 * Optional post-mesh executive synthesis using SDK LocalLLMService (Ollama / OpenAI) or direct BYOK fetch.
 */
export async function synthesizeWithOptionalLlm(
	config: LlmRuntimeConfig,
	userGoal: string,
	taskOutputs: Record<string, unknown>[],
	fetchImpl: typeof fetch = globalThis.fetch,
): Promise<{
	usedLlm: boolean;
	provider: LlmProvider;
	source: "LOCAL_OLLAMA" | "BYOK_CLOUD" | "IN_BROWSER_DETERMINISTIC";
	summary: string;
	error?: string;
}> {
	if (!isLlmActive(config)) {
		return {
			usedLlm: false,
			provider: "none",
			source: "IN_BROWSER_DETERMINISTIC",
			summary: "",
		};
	}

	const compactContext = JSON.stringify(taskOutputs).slice(0, 3000);
	const prompt = `Summarize these decentralized WebMCP agent audit findings for goal "${userGoal}" in 2 concise technical sentences:\n${compactContext}`;

	try {
		// Delegate Ollama and OpenAI to SDK LocalLLMService when using default fetch
		if (
			(config.provider === "ollama" || config.provider === "openai") &&
			fetchImpl === globalThis.fetch
		) {
			const result = await LocalLLMService.generate(
				prompt,
				"You are an autonomous agent participating in the Open Agentic Web mesh.",
				toSdkLlmConfig(config),
			);
			return {
				usedLlm: result.source !== "IN_BROWSER_DETERMINISTIC",
				provider: config.provider,
				source: result.source,
				summary: result.content,
			};
		}

		if (config.provider === "ollama") {
			const baseUrl = (config.endpoint || "http://localhost:11434").replace(
				/\/+$/,
				"",
			);
			const res = await fetchImpl(`${baseUrl}/api/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: config.model || "llama3.2:1b",
					prompt,
					stream: false,
				}),
			});
			if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
			const data = (await res.json()) as { response?: string };
			return {
				usedLlm: true,
				provider: "ollama",
				source: "LOCAL_OLLAMA",
				summary: data.response?.trim() || "Ollama completed synthesis.",
			};
		}

		if (config.provider === "openai") {
			const res = await fetchImpl(
				config.endpoint || PROVIDER_DEFAULTS.openai.endpoint,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${config.apiKey}`,
					},
					body: JSON.stringify({
						model: config.model || "gpt-4o-mini",
						messages: [{ role: "user", content: prompt }],
						max_tokens: 180,
					}),
				},
			);
			if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
			const data = (await res.json()) as {
				choices?: { message?: { content?: string } }[];
			};
			return {
				usedLlm: true,
				provider: "openai",
				source: "BYOK_CLOUD",
				summary:
					data.choices?.[0]?.message?.content?.trim() ||
					"OpenAI BYOK synthesis complete.",
			};
		}

		if (config.provider === "gemini") {
			const endpoint = `${config.endpoint || PROVIDER_DEFAULTS.gemini.endpoint}?key=${encodeURIComponent(config.apiKey)}`;
			const res = await fetchImpl(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
				}),
			});
			if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
			const data = (await res.json()) as {
				candidates?: { content?: { parts?: { text?: string }[] } }[];
			};
			return {
				usedLlm: true,
				provider: "gemini",
				source: "BYOK_CLOUD",
				summary:
					data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
					"Gemini BYOK synthesis complete.",
			};
		}

		if (config.provider === "anthropic") {
			const res = await fetchImpl(
				config.endpoint || PROVIDER_DEFAULTS.anthropic.endpoint,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-api-key": config.apiKey,
						"anthropic-version": "2023-06-01",
						"anthropic-dangerous-direct-browser-access": "true",
					},
					body: JSON.stringify({
						model: config.model || "claude-3-5-haiku-latest",
						max_tokens: 180,
						messages: [{ role: "user", content: prompt }],
					}),
				},
			);
			if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`);
			const data = (await res.json()) as {
				content?: { text?: string }[];
			};
			return {
				usedLlm: true,
				provider: "anthropic",
				source: "BYOK_CLOUD",
				summary:
					data.content?.[0]?.text?.trim() ||
					"Anthropic BYOK synthesis complete.",
			};
		}

		return {
			usedLlm: false,
			provider: config.provider,
			source: "IN_BROWSER_DETERMINISTIC",
			summary: "",
		};
	} catch (err: unknown) {
		return {
			usedLlm: false,
			provider: config.provider,
			source: "IN_BROWSER_DETERMINISTIC",
			summary: "",
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
