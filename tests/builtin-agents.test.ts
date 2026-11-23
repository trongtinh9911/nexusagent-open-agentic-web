import { describe, expect, it } from "vitest";
import { AgentRegistry } from "../src/agents/builtins";
import { executeEcoTracker } from "../src/agents/eco-tracker-agent";
import { executeFactChecker } from "../src/agents/fact-checker-agent";
import { executePrivacyShield } from "../src/agents/privacy-shield-agent";
import { executeWebResearcher } from "../src/agents/web-researcher-agent";

describe("Built-in Agents", () => {
	it("registers all 4 standard agents", () => {
		const all = AgentRegistry.getAll();
		expect(all).toHaveLength(4);
		const names = all.map((a) => a.name);
		expect(names.some((n) => n.includes("EcoTracker"))).toBe(true);
		expect(names.some((n) => n.includes("TruthMesh"))).toBe(true);
		expect(names.some((n) => n.includes("PrivacyShield"))).toBe(true);
		expect(names.some((n) => n.includes("Cognizant"))).toBe(true);
	});

	it("executes EcoTracker and returns environmental metrics", async () => {
		const res = await executeEcoTracker({ targetUrl: "https://mozilla.org" });
		expect(res.targetUrl).toBe("https://mozilla.org");
		expect(res.cleanEnergyRating).toBeDefined();
		expect(res.estimatedCo2GramsPerVisit).toBeGreaterThan(0);
	});

	it("executes FactChecker and returns consensus ratings", async () => {
		const res = await executeFactChecker({
			statement: "Open agent web enables interoperability.",
		});
		expect(res.consensusScore).toBeGreaterThan(0.8);
		expect(res.veracityRating).toBeDefined();
	});

	it("executes PrivacyShield and audits trackers", async () => {
		const res = await executePrivacyShield({
			targetUrl: "https://example.com",
		});
		expect(res.privacyScore).toBeDefined();
		expect(Array.isArray(res.trackerBreakdown)).toBe(true);
	});

	it("executes WebResearcher and synthesizes brief", async () => {
		const res = await executeWebResearcher({ topic: "Agentic Web" });
		expect(res.synthesisOutcome).toBeDefined();
		expect(Array.isArray(res.keyPillars)).toBe(true);
	});
});
