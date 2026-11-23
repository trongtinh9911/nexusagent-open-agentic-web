import { describe, expect, it } from "vitest";
import { MeshOrchestrator } from "../src/sdk/orchestrator";
import { PermissionController } from "../src/sdk/permissions";

describe("MeshOrchestrator", () => {
	it("compiles user goal into structured DAG MeshPlan", () => {
		const plan = MeshOrchestrator.plan(
			"Audit e-commerce site for carbon footprint, privacy and verify claims",
		);
		expect(plan.id.startsWith("plan_")).toBe(true);
		expect(plan.tasks.length).toBeGreaterThanOrEqual(3);
		expect(plan.resolvedOrder.length).toBe(plan.tasks.length);
		expect(plan.totalEstimatedPermissions.length).toBeGreaterThan(0);
	});

	it("executes MeshPlan end-to-end and produces verifiable receipt", async () => {
		const pc = new PermissionController();
		// Auto-grant for automated test
		pc.setPromptCallback(async () => "grant_session");

		const plan = MeshOrchestrator.plan("Full scan of carbon and privacy");
		const { plan: finishedPlan, receipt } = await MeshOrchestrator.execute(
			plan,
			pc,
		);

		expect(finishedPlan.tasks.every((t) => t.status === "completed")).toBe(
			true,
		);
		expect(receipt.receiptId.startsWith("rcpt_")).toBe(true);
		expect(receipt.cryptographicProof.signature).toBeDefined();
		expect(receipt.taskReceipts.length).toBe(finishedPlan.tasks.length);
	});

	it("halts execution when security gate denies permission", async () => {
		const pc = new PermissionController();
		// Deny
		pc.setPromptCallback(async () => "deny");

		const plan = MeshOrchestrator.plan("Scan website privacy");
		const { plan: finishedPlan, receipt } = await MeshOrchestrator.execute(
			plan,
			pc,
		);

		const deniedTask = finishedPlan.tasks.find((t) => t.status === "denied");
		expect(deniedTask).toBeDefined();
		expect(receipt.taskReceipts.some((r) => r.status === "denied")).toBe(true);
	});
});
