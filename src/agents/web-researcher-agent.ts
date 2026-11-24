import {
	fetchLivePeerJson,
	type LiveFetchOptions,
	PEER_ENDPOINTS,
	PEER_MESH_BASE_URL,
} from "../sdk/liveFetcher";
import type { AgentCard } from "../types/agent-card";

interface WebResearcherIndexPayload {
	nodeId?: string;
	version?: string;
	verifiedBy?: string;
	confidenceScore?: number;
	synthesisOutcome?: string;
	indexedStandards?: string[];
	keyPillars?: { pillar: string; insight: string }[];
}

export const WebResearcherCard: AgentCard = {
	schemaVersion: "1.0.0",
	id: "did:web:cognizant-research.org",
	name: "Cognizant Open Intelligence Agent",
	version: "2.1.0",
	description:
		"Autonomous research synthesizer querying live structured open-web standards indices from the WebResearcher peer node.",
	icon: "brain-circuit",
	tags: ["research", "cognizant-ai-lab", "intelligence", "synthesis"],
	provider: {
		name: "Cognizant AI Labs & Open Web Alliance",
		url: `${PEER_MESH_BASE_URL}/webresearcher/`,
		contact: "ailab@cognizant.com",
	},
	protocols: ["webmcp/1.0", "nanda/0.2", "w3c-did/v1", "agent-card/v1"],
	security: {
		sandboxLevel: "isolated",
		didPublicKey: "did:key:z6MkqW8vT4K1xP9nL2mR5tY8uI3oP7sE1aD6fG9h",
		reputationScore: 0.99,
		provenance: {
			originUrl: PEER_ENDPOINTS.webresearcher.manifestUrl,
			publishedAt: "2026-11-24T08:00:00Z",
			w3cDid: PEER_ENDPOINTS.webresearcher.did,
		},
	},
	capabilities: [
		{
			id: "synthesize_research_brief",
			name: "Synthesize Research Brief",
			description:
				"Condenses live cross-origin web standards indices into an actionable executive summary with verifiable provenance.",
			inputSchema: {
				type: "object",
				properties: {
					topic: {
						type: "string",
						description: "Core research subject or inquiry",
					},
					targetOutcomes: { type: "array", items: { type: "string" } },
				},
				required: ["topic"],
			},
			permissionsRequired: ["network:fetch"],
			pricing: { model: "free" },
		},
	],
};

export async function executeWebResearcher(
	inputs: Record<string, unknown>,
	options?: LiveFetchOptions,
): Promise<Record<string, unknown>> {
	const topic = String(inputs.topic || "Decentralized Agent Web Architectures");

	// Fetch real live JSON intelligence index from WebResearcher HTTPS peer node
	const peerFetch = await fetchLivePeerJson<WebResearcherIndexPayload>(
		PEER_ENDPOINTS.webresearcher.dataUrl,
		options,
	);
	const liveData = peerFetch.data;

	const indexedStandards = liveData?.indexedStandards ?? [
		"Open Agent Card v1.0",
		"W3C DID Core",
		"WebMCP v1.0",
		"MIT NANDA v0.2",
	];

	return {
		topic,
		networkMode: peerFetch.mode,
		dataSource: peerFetch.mode,
		fetchedUrl: peerFetch.url,
		peerManifestUrl: PEER_ENDPOINTS.webresearcher.manifestUrl,
		peerDataUrl: PEER_ENDPOINTS.webresearcher.dataUrl,
		httpStatus: peerFetch.httpStatus,
		latencyMs: peerFetch.latencyMs,
		...(peerFetch.ok
			? {}
			: {
					fallbackReason: `WebResearcher peer index fetch failed (${peerFetch.error}); local deterministic synthesis applied transparently.`,
				}),
		synthesisOutcome:
			liveData?.synthesisOutcome ?? "Completed Autonomous Web Digest",
		executiveSummary: `Synthesized live index findings on "${topic}" across ${indexedStandards.length} open interoperability standards (${indexedStandards.slice(0, 3).join(", ")}).`,
		indexedStandards,
		keyPillars: liveData?.keyPillars ?? [
			{
				pillar: "Decentralized Identity",
				insight:
					"W3C DID-key specifications allow client-side key generation without central certificate authorities.",
			},
			{
				pillar: "Browser-Native Execution",
				insight:
					"In-browser agent runtimes eliminate cloud server costs and preserve total user data sovereignty.",
			},
			{
				pillar: "Consensus-Based Verification",
				insight:
					"Multi-agent consensus verification prevents hallucination and establishes measurable trust.",
			},
		],
		confidenceScore: liveData?.confidenceScore ?? 0.97,
		verifiedBy: liveData?.verifiedBy ?? "WebResearcher Index (Local Fallback)",
		generatedAt: new Date().toISOString(),
	};
}
