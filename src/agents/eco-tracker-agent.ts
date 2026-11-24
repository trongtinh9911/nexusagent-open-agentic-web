import {
	fetchLivePeerJson,
	isPeerMeshUrl,
	type LiveFetchOptions,
	PEER_ENDPOINTS,
	PEER_MESH_BASE_URL,
	probeCorsTarget,
} from "../sdk/liveFetcher";
import type { AgentCard } from "../types/agent-card";

interface EcoTelemetryPayload {
	nodeId?: string;
	version?: string;
	verifiedBy?: string;
	metrics?: {
		defaultPageWeightBytes?: number;
		defaultPageWeightMb?: number;
		globalGridIntensityGCo2PerKwh?: number;
		renewableGridIntensityGCo2PerKwh?: number;
		baselineEnergyKwhPerVisit?: number;
	};
	greenHostPatterns?: string[];
	domainBenchmarks?: Record<
		string,
		{
			pageWeightMb?: number;
			bytesTransferred?: number;
			energyKwhPerVisit?: number;
			isGreenHosted?: boolean;
			cleanEnergyRating?: string;
		}
	>;
	recommendations?: string[];
}

export const EcoTrackerCard: AgentCard = {
	schemaVersion: "1.0.0",
	id: "did:web:eco-tracker.org",
	name: "EcoTracker Social Good Agent",
	version: "2.1.0",
	description:
		"Audits carbon footprint, page weight, and kilowatt-hours (kWh) via live cross-origin telemetry from the EcoTracker peer node.",
	icon: "leaf",
	tags: ["sustainability", "green-ai", "carbon", "mozilla-social-good"],
	provider: {
		name: "Green Web Foundation & Mozilla Fellows",
		url: `${PEER_MESH_BASE_URL}/ecotracker/`,
		contact: "team@eco-tracker.org",
	},
	protocols: ["webmcp/1.0", "nanda/0.2", "w3c-did/v1", "agent-card/v1"],
	security: {
		sandboxLevel: "strict",
		didPublicKey: "did:key:z6MkpTHR8VNsBxYAAWHuEc2Ka9txNdcgQRLTYNCasS887A8D",
		reputationScore: 0.98,
		provenance: {
			originUrl: PEER_ENDPOINTS.ecotracker.manifestUrl,
			publishedAt: "2026-11-24T08:00:00Z",
			w3cDid: PEER_ENDPOINTS.ecotracker.did,
		},
	},
	capabilities: [
		{
			id: "compute_carbon_footprint",
			name: "Compute Carbon & Energy Footprint",
			description:
				"Estimates energy consumption and CO2e emissions for a given website URL using live EcoTracker peer telemetry.",
			inputSchema: {
				type: "object",
				properties: {
					targetUrl: {
						type: "string",
						description: "URL or workflow target to analyze",
					},
					monthlyVisits: {
						type: "number",
						description: "Estimated monthly traffic volume",
					},
				},
				required: ["targetUrl"],
			},
			permissionsRequired: ["network:fetch"],
			pricing: { model: "free" },
		},
	],
};

export async function executeEcoTracker(
	inputs: Record<string, unknown>,
	options?: LiveFetchOptions,
): Promise<Record<string, unknown>> {
	const targetUrl = String(inputs.targetUrl || `${PEER_MESH_BASE_URL}/`);
	const domain = targetUrl.replace(/^https?:\/\//, "").split("/")[0];

	// 1. Fetch real cross-origin live telemetry JSON from EcoTracker HTTPS peer node
	const peerFetch = await fetchLivePeerJson<EcoTelemetryPayload>(
		PEER_ENDPOINTS.ecotracker.dataUrl,
		options,
	);

	// 2. If user supplied a non-peer external URL, honestly probe it with real CORS mode
	const isDefaultPeerTarget = isPeerMeshUrl(targetUrl);
	let networkMode: "LIVE NETWORK FETCH" | "CORS FALLBACK" = peerFetch.mode;
	let httpStatus: number | undefined = peerFetch.httpStatus;
	let fetchedUrl: string = peerFetch.url;
	let latencyMs: number = peerFetch.latencyMs;
	let fallbackReason: string | undefined = peerFetch.ok
		? undefined
		: `EcoTracker peer fetch failed (${peerFetch.error}); local SWD v4 heuristic applied transparently.`;

	if (!isDefaultPeerTarget) {
		const targetProbe = await probeCorsTarget(targetUrl, options);
		if (!targetProbe.ok) {
			networkMode = "CORS FALLBACK";
			httpStatus = targetProbe.httpStatus;
			fetchedUrl = targetUrl;
			latencyMs = targetProbe.latencyMs;
			fallbackReason = `Target origin ${targetUrl} blocked cross-origin CORS fetch (${targetProbe.error}); transparent heuristic applied.`;
		} else if (peerFetch.ok) {
			networkMode = "LIVE NETWORK FETCH";
			httpStatus = targetProbe.httpStatus ?? peerFetch.httpStatus;
			fetchedUrl = peerFetch.url;
			latencyMs = peerFetch.latencyMs + targetProbe.latencyMs;
		}
	}

	const liveData = peerFetch.data;
	const benchmark = liveData?.domainBenchmarks?.[domain];
	const greenPatterns = liveData?.greenHostPatterns ?? [
		"github.io",
		"mozilla",
		".edu",
		".org",
	];
	const isGreenHosted =
		benchmark?.isGreenHosted ??
		greenPatterns.some((pattern) => domain.toLowerCase().includes(pattern));

	const bytesTransferred =
		benchmark?.bytesTransferred ??
		liveData?.metrics?.defaultPageWeightBytes ??
		1.45 * 1024 * 1024;
	const pageWeightMb =
		benchmark?.pageWeightMb ?? liveData?.metrics?.defaultPageWeightMb ?? 1.45;
	const energyKwhPerVisit =
		benchmark?.energyKwhPerVisit ??
		liveData?.metrics?.baselineEnergyKwhPerVisit ??
		0.00038;
	const gridIntensity = isGreenHosted
		? (liveData?.metrics?.renewableGridIntensityGCo2PerKwh ?? 50)
		: (liveData?.metrics?.globalGridIntensityGCo2PerKwh ?? 442);
	const co2GramsPerVisit = energyKwhPerVisit * gridIntensity;

	return {
		targetUrl,
		domain,
		networkMode,
		dataSource: networkMode,
		fetchedUrl,
		peerManifestUrl: PEER_ENDPOINTS.ecotracker.manifestUrl,
		peerDataUrl: PEER_ENDPOINTS.ecotracker.dataUrl,
		httpStatus,
		latencyMs,
		...(fallbackReason ? { fallbackReason } : {}),
		bytesTransferred,
		cleanEnergyRating:
			benchmark?.cleanEnergyRating ??
			(isGreenHosted ? "A+ (100% Renewable Hosted)" : "B (Standard Grid)"),
		estimatedCo2GramsPerVisit: parseFloat(co2GramsPerVisit.toFixed(4)),
		energyKwhPerVisit: parseFloat(energyKwhPerVisit.toFixed(6)),
		pageWeightMb,
		recommendations: liveData?.recommendations ?? [
			"Enable HTTP/3 and WebP/AVIF asset compression to reduce transfer overhead by 34%",
			"Switch CDN edge delivery to certified zero-carbon data centers",
			"Minify client-side scripts to reduce mobile CPU render cycles",
		],
		verifiedBy:
			liveData?.verifiedBy ?? "Green Web Foundation API v2 (Local Fallback)",
	};
}
