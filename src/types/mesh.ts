import type { PermissionType } from "./agent-card";

export type TaskStatus =
	| "pending"
	| "requesting_permission"
	| "running"
	| "completed"
	| "failed"
	| "denied";

export interface MeshTask {
	id: string;
	agentId: string;
	capabilityId: string;
	title: string;
	description: string;
	inputs: Record<string, unknown>;
	outputs?: Record<string, unknown>;
	dependencies: string[]; // task IDs that must complete first
	status: TaskStatus;
	executionTimeMs?: number;
	error?: string;
	requiredPermissions: PermissionType[];
}

export interface MeshPlan {
	id: string;
	userGoal: string;
	createdAt: string;
	tasks: MeshTask[];
	resolvedOrder: string[]; // topological sort of task IDs
	totalEstimatedPermissions: PermissionType[];
}

export interface VerifiableReceipt {
	receiptId: string;
	planId: string;
	userGoal: string;
	timestamp: string;
	clientDid: string;
	executedTasksCount: number;
	cryptographicProof: {
		hashAlgorithm: "SHA-256";
		merkleRoot: string;
		signature: string;
	};
	taskReceipts: {
		taskId: string;
		agentId: string;
		capabilityId: string;
		inputHash: string;
		outputHash: string;
		durationMs: number;
		status: TaskStatus;
	}[];
}
