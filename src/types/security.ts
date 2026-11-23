import type { PermissionType } from "./agent-card";

export interface PermissionRequest {
	id: string;
	agentId: string;
	agentName: string;
	permissions: PermissionType[];
	purpose: string;
	timestamp: string;
}

export type PermissionDecision = "grant_once" | "grant_session" | "deny";

export interface PermissionGrant {
	permission: PermissionType;
	grantedToAgentId: string;
	scope: "once" | "session";
	grantedAt: string;
}
