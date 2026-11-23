export type PermissionType =
	| "dom:read"
	| "dom:write"
	| "network:fetch"
	| "storage:read"
	| "storage:write"
	| "identity:sign"
	| "agent:delegate";

export interface PricingInfo {
	model: "free" | "per_call" | "micropayment";
	costPerCall?: number;
	currency?: string;
}

export interface AgentCapability {
	id: string;
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	outputSchema?: Record<string, unknown>;
	permissionsRequired: PermissionType[];
	pricing?: PricingInfo;
}

export interface AgentSecurity {
	sandboxLevel: "strict" | "isolated" | "trusted";
	didPublicKey?: string;
	signature?: string;
	reputationScore?: number; // 0.0 - 1.0 (verified by consensus)
	provenance: {
		originUrl: string;
		publishedAt: string;
		w3cDid: string;
	};
}

export interface AgentCard {
	schemaVersion: "1.0.0";
	id: string;
	name: string;
	version: string;
	description: string;
	icon?: string;
	tags: string[];
	provider: {
		name: string;
		url: string;
		contact?: string;
	};
	protocols: ("webmcp/1.0" | "nanda/0.2" | "w3c-did/v1" | "agent-card/v1")[];
	security: AgentSecurity;
	capabilities: AgentCapability[];
}
