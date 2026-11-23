import type { PermissionType } from "../types/agent-card";
import type { PermissionDecision, PermissionRequest } from "../types/security";

export type PermissionPromptCallback = (
	request: PermissionRequest,
) => Promise<PermissionDecision>;

export class PermissionController {
	private grants: Map<string, Set<PermissionType>> = new Map();
	private promptCallback: PermissionPromptCallback | null = null;

	public setPromptCallback(cb: PermissionPromptCallback): void {
		this.promptCallback = cb;
	}

	public hasPermission(agentId: string, permission: PermissionType): boolean {
		const agentGrants = this.grants.get(agentId);
		return agentGrants ? agentGrants.has(permission) : false;
	}

	public grantPermission(agentId: string, permission: PermissionType): void {
		if (!this.grants.has(agentId)) {
			this.grants.set(agentId, new Set());
		}
		this.grants.get(agentId)!.add(permission);
	}

	public revokeAll(agentId?: string): void {
		if (agentId) {
			this.grants.delete(agentId);
		} else {
			this.grants.clear();
		}
	}

	public async requestPermissions(
		agentId: string,
		agentName: string,
		permissions: PermissionType[],
		purpose: string,
	): Promise<boolean> {
		const ungranted = permissions.filter(
			(p) => !this.hasPermission(agentId, p),
		);
		if (ungranted.length === 0) {
			return true;
		}

		if (!this.promptCallback) {
			// Default security stance: Deny if no UI callback is attached
			return false;
		}

		const request: PermissionRequest = {
			id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
			agentId,
			agentName,
			permissions: ungranted,
			purpose,
			timestamp: new Date().toISOString(),
		};

		const decision = await this.promptCallback(request);
		if (decision === "grant_session" || decision === "grant_once") {
			ungranted.forEach((p) => this.grantPermission(agentId, p));
			return true;
		}

		return false;
	}
}
