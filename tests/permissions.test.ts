import { describe, expect, it, vi } from "vitest";
import { PermissionController } from "../src/sdk/permissions";

describe("PermissionController", () => {
	it("manages grants and revocations", () => {
		const pc = new PermissionController();
		const agentId = "did:web:eco-tracker.org";

		expect(pc.hasPermission(agentId, "network:fetch")).toBe(false);
		pc.grantPermission(agentId, "network:fetch");
		expect(pc.hasPermission(agentId, "network:fetch")).toBe(true);

		pc.revokeAll(agentId);
		expect(pc.hasPermission(agentId, "network:fetch")).toBe(false);
	});

	it("triggers prompt callback when ungranted permissions are requested", async () => {
		const pc = new PermissionController();
		const agentId = "did:web:privacy-shield.org";

		const mockCallback = vi.fn().mockResolvedValue("grant_session");
		pc.setPromptCallback(mockCallback);

		const granted = await pc.requestPermissions(
			agentId,
			"Privacy Shield",
			["dom:read", "network:fetch"],
			"Inspect DOM trackers",
		);

		expect(granted).toBe(true);
		expect(mockCallback).toHaveBeenCalledOnce();
		expect(pc.hasPermission(agentId, "dom:read")).toBe(true);
		expect(pc.hasPermission(agentId, "network:fetch")).toBe(true);
	});

	it("honors user denial in security gate", async () => {
		const pc = new PermissionController();
		const agentId = "did:web:untrusted.org";

		const mockCallback = vi.fn().mockResolvedValue("deny");
		pc.setPromptCallback(mockCallback);

		const granted = await pc.requestPermissions(
			agentId,
			"Untrusted Agent",
			["storage:write"],
			"Write tracking cookies",
		);

		expect(granted).toBe(false);
		expect(pc.hasPermission(agentId, "storage:write")).toBe(false);
	});
});
