export interface LLMConfig {
	provider: "in-browser-mock" | "ollama" | "byok-openai" | "byok-gemini";
	apiKey?: string;
	baseUrl?: string; // e.g. "http://localhost:11434"
	modelName?: string;
}

export class LocalLLMService {
	public static async generate(
		prompt: string,
		systemPrompt = "You are an autonomous agent participating in the Open Agentic Web mesh.",
		config?: LLMConfig,
	): Promise<{
		content: string;
		provider: string;
		model: string;
		source: "LOCAL_OLLAMA" | "BYOK_CLOUD" | "IN_BROWSER_DETERMINISTIC";
	}> {
		if (config?.provider === "ollama") {
			try {
				const baseUrl = config.baseUrl || "http://localhost:11434";
				const model = config.modelName || "llama3.2:1b";
				const resp = await fetch(`${baseUrl}/api/generate`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						model,
						prompt: `${systemPrompt}\n\nTask: ${prompt}`,
						stream: false,
					}),
				});
				if (resp.ok) {
					const data = await resp.json();
					return {
						content: data.response,
						provider: "Ollama (Local)",
						model,
						source: "LOCAL_OLLAMA",
					};
				}
			} catch {
				// fall through to in-browser deterministic
			}
		}

		if (config?.provider === "byok-openai" && config.apiKey) {
			try {
				const resp = await fetch("https://api.openai.com/v1/chat/completions", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${config.apiKey}`,
					},
					body: JSON.stringify({
						model: config.modelName || "gpt-4o-mini",
						messages: [
							{ role: "system", content: systemPrompt },
							{ role: "user", content: prompt },
						],
					}),
				});
				if (resp.ok) {
					const data = await resp.json();
					return {
						content: data.choices[0]?.message?.content || "",
						provider: "OpenAI BYOK",
						model: config.modelName || "gpt-4o-mini",
						source: "BYOK_CLOUD",
					};
				}
			} catch {
				// fall through
			}
		}

		return {
			content: `[Synthesized via In-Browser WebMCP Engine: ${prompt.slice(0, 80)}]`,
			provider: "In-Browser WebMCP (Zero-Cost)",
			model: "mesh-v1-deterministic",
			source: "IN_BROWSER_DETERMINISTIC",
		};
	}
}
