import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AgentRegistry } from "../src/agents/builtins";
import { executeEcoTracker } from "../src/agents/eco-tracker-agent";
import { executeFactChecker } from "../src/agents/fact-checker-agent";
import { executePrivacyShield } from "../src/agents/privacy-shield-agent";
import { executeWebResearcher } from "../src/agents/web-researcher-agent";
import { discoverPeerMeshNodes } from "../src/components/discoverManifest";
import { resolveNetworkProvenance } from "../src/components/networkProvenance";
import {
	extractTargetUrlFromGoal,
	fetchLivePeerJson,
	isPeerMeshUrl,
	LIVE_PEER_NODES,
	PEER_ENDPOINTS,
	PEER_MESH_BASE_URL,
	probeCorsTarget,
} from "../src/sdk/liveFetcher";
import { MeshOrchestrator } from "../src/sdk/orchestrator";
import { AgentCardValidator } from "../src/sdk/validator";

function makeJsonResponse(payload: unknown, status = 200): Response {
	return new Response(JSON.stringify(payload), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Access-Control-Allow-Origin": "*",
		},
	});
}

describe("Live Cross-Origin Peer Mesh & Provenance (v2.1.0)", () => {
	afterEach(() => {
		AgentRegistry.resetToBuiltins();
	});

	it("points agent-network.json to live HTTPS nexusagent-peer-nodes endpoints", () => {
		const networkPath = resolve(process.cwd(), "public/agent-network.json");
		const network = JSON.parse(readFileSync(networkPath, "utf8")) as {
			networkVersion: string;
			peerMeshDirectoryUrl: string;
			nodes: { manifestUrl: string; dataUrl?: string }[];
		};

		expect(network.networkVersion).toBe("2.1.0");
		expect(network.peerMeshDirectoryUrl).toBe(PEER_ENDPOINTS.meshDirectory);
		const remoteNodes = network.nodes.filter((n) =>
			n.manifestUrl.startsWith(PEER_MESH_BASE_URL),
		);
		expect(remoteNodes).toHaveLength(4);
		expect(remoteNodes.every((n) => Boolean(n.dataUrl))).toBe(true);
	});

	it("extracts explicit URLs from prompts or defaults cleanly to the live peer mesh", () => {
		expect(
			extractTargetUrlFromGoal(
				"Audit carbon footprint and privacy trackers across mesh",
			),
		).toBe(`${PEER_MESH_BASE_URL}/`);
		expect(
			extractTargetUrlFromGoal(
				"Audit https://example.com/shop for carbon and trackers.",
			),
		).toBe("https://example.com/shop");
		expect(isPeerMeshUrl(PEER_ENDPOINTS.ecotracker.dataUrl)).toBe(true);
		expect(isPeerMeshUrl("https://example.com")).toBe(false);
	});

	it("returns LIVE NETWORK FETCH with HTTP 200 and ACAO header on real JSON fetch, and CORS FALLBACK on failure", async () => {
		const okFetch = (async () =>
			makeJsonResponse({ nodeId: "test-peer", ok: true }, 200)) as typeof fetch;

		const live = await fetchLivePeerJson<{ nodeId: string }>(
			PEER_ENDPOINTS.ecotracker.dataUrl,
			{ fetchImpl: okFetch },
		);
		expect(live.ok).toBe(true);
		expect(live.mode).toBe("LIVE NETWORK FETCH");
		expect(live.httpStatus).toBe(200);
		expect(live.acaoHeader).toBe("*");
		expect(live.data?.nodeId).toBe("test-peer");

		const corsBlockedFetch = (async () => {
			throw new TypeError("Failed to fetch (CORS policy blocked)");
		}) as typeof fetch;

		const fallback = await fetchLivePeerJson(
			"https://cors-blocked.example/data.json",
			{ fetchImpl: corsBlockedFetch },
		);
		expect(fallback.ok).toBe(false);
		expect(fallback.mode).toBe("CORS FALLBACK");
		expect(fallback.error).toContain("CORS");

		const probeFallback = await probeCorsTarget(
			"https://cors-blocked.example",
			{ fetchImpl: corsBlockedFetch },
		);
		expect(probeFallback.ok).toBe(false);
		expect(probeFallback.mode).toBe("CORS FALLBACK");
	});

	it("executes all 4 agents with LIVE NETWORK FETCH (HTTP 200) against peer JSON endpoints", async () => {
		const mockPeerFetch = (async (input: string | URL | Request) => {
			const url = String(input);
			if (url === PEER_ENDPOINTS.ecotracker.dataUrl) {
				return makeJsonResponse({
					verifiedBy: "EcoTracker Live Peer Node",
					metrics: {
						defaultPageWeightBytes: 440402,
						defaultPageWeightMb: 0.42,
						renewableGridIntensityGCo2PerKwh: 50,
						baselineEnergyKwhPerVisit: 0.000145,
					},
					greenHostPatterns: ["github.io"],
					recommendations: ["Serve static manifests over CDN edge"],
				});
			}
			if (url === PEER_ENDPOINTS.privacyshield.dataUrl) {
				return makeJsonResponse({
					rulesetVersion: "2026.11.24",
					verifiedBy: "PrivacyShield Live Peer Node",
					cleanDomains: ["trongtinh9911.github.io"],
					knownTrackers: [],
					cookieFlagsBaseline: {
						secure: true,
						httpOnly: true,
						sameSite: "Strict",
					},
					userActionRecommendations: ["Send Sec-GPC: 1"],
				});
			}
			if (url === PEER_ENDPOINTS.truthmesh.dataUrl) {
				return makeJsonResponse({
					verifiedBy: "TruthMesh Live Consensus Peer",
					quorum: {
						validatorsOnline: 7,
						validatorsAgreed: 7,
						consensusScore: 0.96,
						veracityRating: "High Confidence (Quorum Certified)",
					},
					sourcesCrossReferenced: 7,
					peerCitations: [{ source: "W3C DID Core", status: "Confirmed" }],
					consensusSummary: "7/7 validators certified.",
				});
			}
			if (url === PEER_ENDPOINTS.webresearcher.dataUrl) {
				return makeJsonResponse({
					verifiedBy: "WebResearcher Live Peer Index",
					confidenceScore: 0.97,
					synthesisOutcome: "Completed Live Cross-Origin Web Digest",
					indexedStandards: ["Open Agent Card v1.0", "W3C DID", "WebMCP v1.0"],
					keyPillars: [{ pillar: "CORS Discovery", insight: "Live HTTP 200" }],
				});
			}
			return makeJsonResponse({ error: "not found" }, 404);
		}) as typeof fetch;

		const eco = await executeEcoTracker(
			{ targetUrl: `${PEER_MESH_BASE_URL}/` },
			{ fetchImpl: mockPeerFetch },
		);
		expect(eco.networkMode).toBe("LIVE NETWORK FETCH");
		expect(eco.httpStatus).toBe(200);
		expect(eco.fetchedUrl).toBe(PEER_ENDPOINTS.ecotracker.dataUrl);

		const privacy = await executePrivacyShield(
			{ targetUrl: `${PEER_MESH_BASE_URL}/` },
			{ fetchImpl: mockPeerFetch },
		);
		expect(privacy.networkMode).toBe("LIVE NETWORK FETCH");
		expect(privacy.httpStatus).toBe(200);
		expect(privacy.fetchedUrl).toBe(PEER_ENDPOINTS.privacyshield.dataUrl);

		const truth = await executeFactChecker(
			{ statement: "Open Agentic Web uses W3C DIDs" },
			{ fetchImpl: mockPeerFetch },
		);
		expect(truth.networkMode).toBe("LIVE NETWORK FETCH");
		expect(truth.httpStatus).toBe(200);
		expect(truth.fetchedUrl).toBe(PEER_ENDPOINTS.truthmesh.dataUrl);

		const research = await executeWebResearcher(
			{ topic: "Open Agentic Web" },
			{ fetchImpl: mockPeerFetch },
		);
		expect(research.networkMode).toBe("LIVE NETWORK FETCH");
		expect(research.httpStatus).toBe(200);
		expect(research.fetchedUrl).toBe(PEER_ENDPOINTS.webresearcher.dataUrl);

		const prov = resolveNetworkProvenance({
			status: "completed",
			networkMode: "LIVE NETWORK FETCH",
			outputs: eco,
		});
		expect(prov?.badgeLabel).toBe("LIVE NETWORK FETCH");
		expect(prov?.httpStatus).toBe(200);
		expect(prov?.sourceDetail).toContain("HTTP 200");
		expect(prov?.sourceDetail).toContain(PEER_ENDPOINTS.ecotracker.dataUrl);
	});

	it("honestly falls back to CORS FALLBACK when user targets a CORS-blocked domain", async () => {
		const mixedFetch = (async (input: string | URL | Request) => {
			const url = String(input);
			if (url.startsWith(PEER_MESH_BASE_URL)) {
				return makeJsonResponse({ verifiedBy: "Peer Node" }, 200);
			}
			throw new TypeError("TypeError: Failed to fetch (CORS blocked)");
		}) as typeof fetch;

		const ecoBlocked = await executeEcoTracker(
			{ targetUrl: "https://cors-blocked-shop.example" },
			{ fetchImpl: mixedFetch },
		);
		expect(ecoBlocked.networkMode).toBe("CORS FALLBACK");
		expect(String(ecoBlocked.fallbackReason)).toContain("blocked cross-origin");

		const privacyBlocked = await executePrivacyShield(
			{ targetUrl: "https://cors-blocked-shop.example" },
			{ fetchImpl: mixedFetch },
		);
		expect(privacyBlocked.networkMode).toBe("CORS FALLBACK");
		expect(String(privacyBlocked.fallbackReason)).toContain(
			"blocked cross-origin",
		);
	});

	it("discovers and validates all 4 live peer node manifests cleanly via discoverPeerMeshNodes", async () => {
		const mockManifestFetch = (async (input: string | URL | Request) => {
			const url = String(input);
			const peer = LIVE_PEER_NODES.find((p) => p.manifestUrl === url);
			if (!peer) {
				return makeJsonResponse({ error: "not found" }, 404);
			}
			return makeJsonResponse({
				schemaVersion: "1.0.0",
				id: peer.did,
				name: peer.name,
				version: "2.1.0",
				description: `Live CORS peer node for ${peer.slug}`,
				tags: [peer.slug, "live-peer"],
				provider: {
					name: "NexusAgent Peer Mesh",
					url: `${PEER_MESH_BASE_URL}/${peer.slug}/`,
				},
				protocols: ["webmcp/1.0", "nanda/0.2", "w3c-did/v1", "agent-card/v1"],
				security: {
					sandboxLevel: "strict",
					reputationScore: 0.99,
					provenance: {
						originUrl: peer.manifestUrl,
						publishedAt: "2026-11-24T08:00:00Z",
						w3cDid: peer.did,
					},
				},
				capabilities: [
					{
						id: `run_${peer.slug}`,
						name: `Run ${peer.name}`,
						description: `Executes ${peer.slug}`,
						inputSchema: { type: "object", properties: {} },
						permissionsRequired: ["network:fetch"],
					},
				],
			});
		}) as typeof fetch;

		const summary = await discoverPeerMeshNodes({
			fetchImpl: mockManifestFetch,
		});
		expect(summary.ok).toBe(true);
		expect(summary.liveCount).toBe(4);
		expect(summary.totalCount).toBe(4);
		for (const peer of LIVE_PEER_NODES) {
			const registered = AgentRegistry.get(peer.did);
			expect(registered).toBeDefined();
			expect(AgentCardValidator.validate(registered?.card).isValid).toBe(true);
		}
	});

	it("wires default MeshOrchestrator plan to all 4 agents targeting the live peer mesh", () => {
		const plan = MeshOrchestrator.plan(
			"Research and audit Open Agentic Web peer mesh for carbon emissions, privacy tracking scripts, and verify claims",
		);
		expect(plan.tasks).toHaveLength(4);
		const ecoTask = plan.tasks.find(
			(t) => t.agentId === "did:web:eco-tracker.org",
		);
		const privacyTask = plan.tasks.find(
			(t) => t.agentId === "did:web:privacy-shield.org",
		);
		expect(ecoTask?.inputs.targetUrl).toBe(`${PEER_MESH_BASE_URL}/`);
		expect(privacyTask?.inputs.targetUrl).toBe(`${PEER_MESH_BASE_URL}/`);
	});
});
