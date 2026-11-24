export type NetworkProvenanceLabel = "LIVE NETWORK FETCH" | "CORS FALLBACK";

export const PEER_MESH_BASE_URL =
	"https://trongtinh9911.github.io/nexusagent-peer-nodes";

export interface PeerNodeEndpoint {
	slug: "ecotracker" | "privacyshield" | "truthmesh" | "webresearcher";
	name: string;
	did: string;
	category: string;
	manifestUrl: string;
	dataUrl: string;
}

export const PEER_ENDPOINTS = {
	meshDirectory: `${PEER_MESH_BASE_URL}/.well-known/agent.json`,
	ecotracker: {
		slug: "ecotracker" as const,
		name: "EcoTracker Peer Node",
		did: "did:web:trongtinh9911.github.io:nexusagent-peer-nodes:ecotracker",
		category: "Sustainability",
		manifestUrl: `${PEER_MESH_BASE_URL}/ecotracker/.well-known/agent.json`,
		dataUrl: `${PEER_MESH_BASE_URL}/ecotracker/telemetry.json`,
	},
	privacyshield: {
		slug: "privacyshield" as const,
		name: "PrivacyShield Peer Node",
		did: "did:web:trongtinh9911.github.io:nexusagent-peer-nodes:privacyshield",
		category: "Security & Privacy",
		manifestUrl: `${PEER_MESH_BASE_URL}/privacyshield/.well-known/agent.json`,
		dataUrl: `${PEER_MESH_BASE_URL}/privacyshield/audit-rules.json`,
	},
	truthmesh: {
		slug: "truthmesh" as const,
		name: "TruthMesh Peer Node",
		did: "did:web:trongtinh9911.github.io:nexusagent-peer-nodes:truthmesh",
		category: "Consensus & Verification",
		manifestUrl: `${PEER_MESH_BASE_URL}/truthmesh/.well-known/agent.json`,
		dataUrl: `${PEER_MESH_BASE_URL}/truthmesh/consensus.json`,
	},
	webresearcher: {
		slug: "webresearcher" as const,
		name: "WebResearcher Peer Node",
		did: "did:web:trongtinh9911.github.io:nexusagent-peer-nodes:webresearcher",
		category: "Research & Synthesis",
		manifestUrl: `${PEER_MESH_BASE_URL}/webresearcher/.well-known/agent.json`,
		dataUrl: `${PEER_MESH_BASE_URL}/webresearcher/index.json`,
	},
} as const;

export const LIVE_PEER_NODES: PeerNodeEndpoint[] = [
	PEER_ENDPOINTS.ecotracker,
	PEER_ENDPOINTS.privacyshield,
	PEER_ENDPOINTS.truthmesh,
	PEER_ENDPOINTS.webresearcher,
];

export interface LiveFetchResult<T = Record<string, unknown>> {
	ok: boolean;
	mode: NetworkProvenanceLabel;
	url: string;
	httpStatus?: number;
	latencyMs: number;
	contentType?: string | null;
	acaoHeader?: string | null;
	data?: T;
	error?: string;
}

export interface LiveProbeResult {
	ok: boolean;
	mode: NetworkProvenanceLabel;
	url: string;
	httpStatus?: number;
	latencyMs: number;
	error?: string;
}

export interface LiveFetchOptions {
	timeoutMs?: number;
	fetchImpl?: typeof fetch;
}

/**
 * Checks whether a URL points to the CORS-enabled NexusAgent peer mesh origin.
 */
export function isPeerMeshUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return (
			parsed.origin === "https://trongtinh9911.github.io" &&
			parsed.pathname.startsWith("/nexusagent-peer-nodes")
		);
	} catch {
		return false;
	}
}

/**
 * Extracts the first HTTP(S) URL from a natural-language user goal,
 * or defaults to the live HTTPS Open Agentic Web Peer Mesh root.
 */
export function extractTargetUrlFromGoal(userGoal: string): string {
	const match = userGoal.match(/https?:\/\/[^\s"'<>]+/i);
	if (match && match[0]) {
		return match[0].replace(/[.,;:!?)]+$/, "");
	}
	return `${PEER_MESH_BASE_URL}/`;
}

/**
 * Performs a real cross-origin CORS HTTP GET fetch for a JSON peer endpoint.
 * Returns LIVE NETWORK FETCH only on a genuine 2xx JSON response; never uses opaque no-cors probes.
 */
export async function fetchLivePeerJson<T = Record<string, unknown>>(
	url: string,
	options?: LiveFetchOptions,
): Promise<LiveFetchResult<T>> {
	const fetchFn =
		options?.fetchImpl ?? (typeof fetch === "function" ? fetch : undefined);
	const timeoutMs = options?.timeoutMs ?? 6000;
	const start = performance.now();

	if (!fetchFn) {
		return {
			ok: false,
			mode: "CORS FALLBACK",
			url,
			latencyMs: 0,
			error: "Global Fetch API is unavailable in this runtime.",
		};
	}

	const controller =
		typeof AbortController !== "undefined" ? new AbortController() : undefined;
	const timer =
		controller && timeoutMs > 0
			? setTimeout(() => controller.abort(), timeoutMs)
			: undefined;

	try {
		const res = await fetchFn(url, {
			method: "GET",
			mode: "cors",
			headers: { Accept: "application/json" },
			signal: controller?.signal,
		});
		const latencyMs = Math.max(1, Math.round(performance.now() - start));

		if (!res.ok) {
			return {
				ok: false,
				mode: "CORS FALLBACK",
				url,
				httpStatus: res.status,
				latencyMs,
				error: `HTTP ${res.status} ${res.statusText || "Error"}`,
			};
		}

		const data = (await res.json()) as T;
		return {
			ok: true,
			mode: "LIVE NETWORK FETCH",
			url,
			httpStatus: res.status,
			latencyMs,
			contentType: res.headers?.get?.("content-type") ?? null,
			acaoHeader: res.headers?.get?.("access-control-allow-origin") ?? null,
			data,
		};
	} catch (err: unknown) {
		const latencyMs = Math.max(1, Math.round(performance.now() - start));
		const error =
			err instanceof Error
				? err.name === "AbortError"
					? `Request timed out after ${timeoutMs}ms`
					: err.message
				: String(err);

		return {
			ok: false,
			mode: "CORS FALLBACK",
			url,
			latencyMs,
			error,
		};
	} finally {
		if (timer) clearTimeout(timer);
	}
}

/**
 * Probes an arbitrary user-supplied URL with real CORS mode (no opaque no-cors spoofing).
 * If the target origin blocks CORS, this honestly reports CORS FALLBACK.
 */
export async function probeCorsTarget(
	url: string,
	options?: LiveFetchOptions,
): Promise<LiveProbeResult> {
	const fetchFn =
		options?.fetchImpl ?? (typeof fetch === "function" ? fetch : undefined);
	const timeoutMs = options?.timeoutMs ?? 5000;
	const start = performance.now();

	if (!fetchFn) {
		return {
			ok: false,
			mode: "CORS FALLBACK",
			url,
			latencyMs: 0,
			error: "Global Fetch API is unavailable in this runtime.",
		};
	}

	const controller =
		typeof AbortController !== "undefined" ? new AbortController() : undefined;
	const timer =
		controller && timeoutMs > 0
			? setTimeout(() => controller.abort(), timeoutMs)
			: undefined;

	try {
		const res = await fetchFn(url, {
			method: "GET",
			mode: "cors",
			signal: controller?.signal,
		});
		const latencyMs = Math.max(1, Math.round(performance.now() - start));

		if (!res.ok) {
			return {
				ok: false,
				mode: "CORS FALLBACK",
				url,
				httpStatus: res.status,
				latencyMs,
				error: `HTTP ${res.status} ${res.statusText || "Error"}`,
			};
		}

		return {
			ok: true,
			mode: "LIVE NETWORK FETCH",
			url,
			httpStatus: res.status,
			latencyMs,
		};
	} catch (err: unknown) {
		const latencyMs = Math.max(1, Math.round(performance.now() - start));
		const error =
			err instanceof Error
				? err.name === "AbortError"
					? `Request timed out after ${timeoutMs}ms`
					: err.message
				: String(err);

		return {
			ok: false,
			mode: "CORS FALLBACK",
			url,
			latencyMs,
			error,
		};
	} finally {
		if (timer) clearTimeout(timer);
	}
}
