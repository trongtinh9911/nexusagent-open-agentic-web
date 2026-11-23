import { describe, expect, it } from "vitest";
import { EcoTrackerCard } from "../src/agents/eco-tracker-agent";
import { AgentCardValidator } from "../src/sdk/validator";

describe("AgentCardValidator", () => {
	it("validates a compliant Agent Card correctly", () => {
		const res = AgentCardValidator.validate(EcoTrackerCard);
		expect(res.isValid).toBe(true);
		expect(res.errors).toHaveLength(0);
	});

	it("rejects an invalid schemaVersion", () => {
		const invalidCard = { ...EcoTrackerCard, schemaVersion: "2.0.0" };
		const res = AgentCardValidator.validate(invalidCard);
		expect(res.isValid).toBe(false);
		expect(res.errors.some((e) => e.includes("schemaVersion"))).toBe(true);
	});

	it("rejects an empty name or missing provider", () => {
		const invalidCard = {
			...EcoTrackerCard,
			name: "",
			provider: undefined as any,
		};
		const res = AgentCardValidator.validate(invalidCard);
		expect(res.isValid).toBe(false);
		expect(res.errors.some((e) => e.includes("name"))).toBe(true);
		expect(res.errors.some((e) => e.includes("provider"))).toBe(true);
	});

	it("rejects cards with no capabilities", () => {
		const invalidCard = { ...EcoTrackerCard, capabilities: [] };
		const res = AgentCardValidator.validate(invalidCard);
		expect(res.isValid).toBe(false);
		expect(res.errors.some((e) => e.includes("at least one capability"))).toBe(
			true,
		);
	});
});
