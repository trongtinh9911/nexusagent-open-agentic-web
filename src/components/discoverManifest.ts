import { AgentRegistry } from "../agents/builtins";
import { AgentCardValidator } from "../sdk/validator";
import type { AgentCard } from "../types/agent-card";

export interface ManifestDiscoveryResult {
	ok: boolean;
	mode: "LIVE NETWORK FETCH" | "CORS FALLBACK";
	url: string;
	httpStatus?: number;
	latencyMs: number;
	card?: AgentCard;
	error?: string;
	notice: string;
}

export const SELF_MANIFEST_PATH = "./.well-known/agent.json";

/**
 * Normalizes a user-entered domain or URL into its /.well-known/agent.json manifest URL.
 */
export function normalizeManifestUrl(rawInput: string): string {
	const trimmed = rawInput.trim();
	if (trimmed.startsWith("./") || trimmed.startsWith("/")) {
		return trimmed;
	}
	const withProtocol = /^https?:\/\//i.test(trimmed)
		? trimmed
		: `https://${trimmed}`;
	const parsed = new URL(withProtocol);
	if (parsed.pathname === "/" || parsed.pathname === "") {
		parsed.pathname = "/.well-known/agent.json";
	}
	return parsed.toString();
}

/**
 * Fetches a live /.well-known/agent.json manifest (including local ./.well-known/agent.json),
 * validates it against Open Agent Card v1.0 via AgentCardValidator, and registers it into AgentRegistry.
 */
export async function discoverLiveManifest(
	rawUrl: string,
	options?: {
		allowCorsFallback?: boolean;
		fetchImpl?: typeof fetch;
	},
): Promise<ManifestDiscoveryResult> {
	const fetchImpl = options?.fetchImpl;
	const allowCorsFallback = options?.allowCorsFallback ?? false;
	const start = performance.now();

	let resolvedUrl: string;
	try {
		resolvedUrl = normalizeManifestUrl(rawUrl);
	} catch {
		return {
			ok: false,
			mode: "CORS FALLBACK",
			url: rawUrl,
			latencyMs: 0,
			error: "Invalid URL format. Use a domain or /.well-known/agent.json URL.",
			notice: "URL parsing failed.",
		};
	}

	try {
		// Use SDK AgentCardValidator.discoverLiveManifest when using runtime fetch
		if (!fetchImpl) {
			const sdkRes = await AgentCardValidator.discoverLiveManifest(resolvedUrl);
			const latencyMs = Math.round(performance.now() - start);
			if (sdkRes.success && sdkRes.card) {
				AgentRegistry.register(sdkRes.card);
				return {
					ok: true,
					mode: "LIVE NETWORK FETCH",
					url: resolvedUrl,
					httpStatus: 200,
					latencyMs,
					card: sdkRes.card,
					notice: `LIVE NETWORK FETCH (HTTP 200, ${latencyMs}ms): Discovered & verified '${sdkRes.card.name}' from ${resolvedUrl}.`,
				};
			}
			// If manifest was fetched but failed schema validation (not network error), report directly
			if (sdkRes.card && !sdkRes.validation.isValid) {
				return {
					ok: false,
					mode: "LIVE NETWORK FETCH",
					url: resolvedUrl,
					latencyMs,
					error: `Fetched manifest failed Open Agent Card v1.0 validation: ${sdkRes.validation.errors.join("; ")}`,
					notice: "Manifest fetched, but schema validation failed.",
				};
			}
			throw new Error(sdkRes.error || sdkRes.validation.errors.join("; "));
		}

		// Custom fetchImpl path (for deterministic unit tests)
		const res = await fetchImpl(resolvedUrl, {
			method: "GET",
			headers: { Accept: "application/json" },
		});
		const latencyMs = Math.round(performance.now() - start);

		if (!res.ok) {
			throw new Error(`HTTP ${res.status} ${res.statusText}`);
		}

		const json = (await res.json()) as unknown;
		const validation = AgentCardValidator.validate(json);
		if (!validation.isValid) {
			return {
				ok: false,
				mode: "LIVE NETWORK FETCH",
				url: resolvedUrl,
				httpStatus: res.status,
				latencyMs,
				error: `Fetched manifest failed Open Agent Card v1.0 validation: ${validation.errors.join("; ")}`,
				notice: `HTTP ${res.status} received, but schema validation failed.`,
			};
		}

		const card = json as AgentCard;
		AgentRegistry.register(card);

		return {
			ok: true,
			mode: "LIVE NETWORK FETCH",
			url: resolvedUrl,
			httpStatus: res.status,
			latencyMs,
			card,
			notice: `LIVE NETWORK FETCH (HTTP ${res.status}, ${latencyMs}ms): Discovered & verified '${card.name}' from ${resolvedUrl}.`,
		};
	} catch (err: unknown) {
		const latencyMs = Math.round(performance.now() - start);
		const errMsg = err instanceof Error ? err.message : String(err);

		if (!allowCorsFallback) {
			return {
				ok: false,
				mode: "CORS FALLBACK",
				url: resolvedUrl,
				latencyMs,
				error: `Live fetch failed (${errMsg}).`,
				notice: `Could not fetch ${resolvedUrl}.`,
			};
		}

		// Transparent CORS fallback preview card for third-party domains without CORS headers
		const domain = resolvedUrl.replace(/^https?:\/\//, "").split("/")[0];
		const fallbackCard: AgentCard = {
			schemaVersion: "1.0.0",
			id: `did:web:${domain}:agent:custom`,
			name: `${domain.toUpperCase()} Autonomous Agent (CORS Preview)`,
			version: "1.0.0",
			description: `Fallback Agent Card synthesized for ${domain} because the origin blocked cross-origin browser fetch (${errMsg}).`,
			icon: "brain-circuit",
			tags: ["custom", "cors-fallback", "webmcp"],
			provider: {
				name: `${domain} Webmaster`,
				url: `https://${domain}`,
			},
			protocols: ["webmcp/1.0", "agent-card/v1"],
			security: {
				sandboxLevel: "isolated",
				reputationScore: 0.9,
				provenance: {
					originUrl: resolvedUrl,
					publishedAt: new Date().toISOString(),
					w3cDid: `did:web:${domain}`,
				},
			},
			capabilities: [
				{
					id: "custom_query",
					name: "Domain Specific Query",
					description: `Interacts with ${domain} web services via WebMCP adapter.`,
					inputSchema: {
						type: "object",
						properties: { query: { type: "string" } },
					},
					permissionsRequired: ["network:fetch"],
					pricing: { model: "free" },
				},
			],
		};

		const validation = AgentCardValidator.validate(fallbackCard);
		if (!validation.isValid) {
			return {
				ok: false,
				mode: "CORS FALLBACK",
				url: resolvedUrl,
				latencyMs,
				error: `Fallback manifest invalid: ${validation.errors.join(", ")}`,
				notice: "Fallback generation failed.",
			};
		}

		AgentRegistry.register(fallbackCard);

		return {
			ok: true,
			mode: "CORS FALLBACK",
			url: resolvedUrl,
			latencyMs,
			card: fallbackCard,
			notice: `CORS FALLBACK (${latencyMs}ms): Browser blocked direct fetch to ${resolvedUrl} (${errMsg}). Registered transparent preview card.`,
		};
	}
}
