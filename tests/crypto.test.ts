import { describe, expect, it } from "vitest";
import { AgentCrypto } from "../src/sdk/crypto";

describe("AgentCrypto", () => {
	it("computes deterministic SHA-256 hashes", async () => {
		const hash1 = await AgentCrypto.sha256("hello-open-agentic-web");
		const hash2 = await AgentCrypto.sha256("hello-open-agentic-web");
		const hashDifferent = await AgentCrypto.sha256("different-payload");

		expect(hash1).toBe(hash2);
		expect(hash1).not.toBe(hashDifferent);
		expect(hash1.length).toBe(64);
	});

	it("computes Merkle root correctly", async () => {
		const leaves = [
			await AgentCrypto.sha256("leaf-1"),
			await AgentCrypto.sha256("leaf-2"),
			await AgentCrypto.sha256("leaf-3"),
		];
		const root = await AgentCrypto.calculateMerkleRoot(leaves);
		expect(root).toBeDefined();
		expect(root.length).toBe(64);
	});

	it("creates verifiable receipts with signatures and proofs", async () => {
		const mockTasks = [
			{
				taskId: "t1",
				agentId: "did:web:eco-tracker.org",
				capabilityId: "compute_carbon_footprint",
				inputs: { targetUrl: "https://mozilla.org" },
				outputs: { co2: 0.12 },
				durationMs: 45,
				status: "completed" as const,
			},
		];

		const receipt = await AgentCrypto.createReceipt(
			"plan_123",
			"Audit mozilla carbon",
			mockTasks,
		);
		expect(receipt.receiptId.startsWith("rcpt_")).toBe(true);
		expect(receipt.cryptographicProof.merkleRoot).toBeDefined();
		expect(receipt.cryptographicProof.signature).toContain("sig_ed25519_");
		expect(receipt.taskReceipts).toHaveLength(1);
		expect(receipt.taskReceipts[0].inputHash).toBeDefined();
	});
});
