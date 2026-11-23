import { AgentRegistry } from "../agents/builtins";
import type { PermissionType } from "../types/agent-card";
import type {
	MeshPlan,
	MeshTask,
	TaskStatus,
	VerifiableReceipt,
} from "../types/mesh";
import { AgentCrypto } from "./crypto";
import type { PermissionController } from "./permissions";
import { WebMCPClient } from "./web-mcp";

export class MeshOrchestrator {
	/**
	 * Compiles a user prompt into a topologically sorted DAG MeshPlan
	 */
	public static plan(userGoal: string): MeshPlan {
		const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
		const goalLower = userGoal.toLowerCase();
		const tasks: MeshTask[] = [];

		// Intelligently select and chain agents based on intent
		const wantsEco =
			goalLower.includes("carbon") ||
			goalLower.includes("eco") ||
			goalLower.includes("green") ||
			goalLower.includes("energy") ||
			goalLower.includes("footprint") ||
			goalLower.includes("sustainability") ||
			goalLower.includes("all");
		const wantsPrivacy =
			goalLower.includes("privacy") ||
			goalLower.includes("tracker") ||
			goalLower.includes("cookie") ||
			goalLower.includes("pii") ||
			goalLower.includes("gdpr") ||
			goalLower.includes("security") ||
			goalLower.includes("all");
		const wantsFact =
			goalLower.includes("fact") ||
			goalLower.includes("verify") ||
			goalLower.includes("truth") ||
			goalLower.includes("claim") ||
			goalLower.includes("consensus") ||
			goalLower.includes("fake") ||
			goalLower.includes("all");
		const wantsResearch =
			goalLower.includes("research") ||
			goalLower.includes("synthesize") ||
			goalLower.includes("summary") ||
			goalLower.includes("market") ||
			goalLower.includes("all") ||
			(!wantsEco && !wantsPrivacy && !wantsFact);

		let stepIndex = 1;

		// Stage 1: Intelligence & Research gathering
		if (wantsResearch) {
			tasks.push({
				id: `task_${stepIndex++}_research`,
				agentId: "did:web:cognizant-research.org",
				capabilityId: "synthesize_research_brief",
				title: "Gather & Synthesize Topic Intelligence",
				description:
					"Parses multi-source web signals to establish the baseline context for downstream agents.",
				inputs: {
					topic: userGoal,
					targetOutcomes: ["open standards", "interoperability", "governance"],
				},
				dependencies: [],
				status: "pending",
				requiredPermissions: ["network:fetch"],
			});
		}

		// Stage 2: Parallel Audits (Eco & Privacy)
		const auditDeps = tasks.map((t) => t.id);

		if (wantsEco) {
			tasks.push({
				id: `task_${stepIndex++}_eco`,
				agentId: "did:web:eco-tracker.org",
				capabilityId: "compute_carbon_footprint",
				title: "Audit Environmental & Energy Impact",
				description:
					"Calculates page transfer weight, kilowatt-hours, and CO2 emissions per interaction.",
				inputs: {
					targetUrl: userGoal.includes("http")
						? userGoal
						: "https://open-agentic-web.org",
					monthlyVisits: 100000,
				},
				dependencies: auditDeps,
				status: "pending",
				requiredPermissions: ["network:fetch"],
			});
		}

		if (wantsPrivacy) {
			tasks.push({
				id: `task_${stepIndex++}_privacy`,
				agentId: "did:web:privacy-shield.org",
				capabilityId: "audit_trackers_and_pii",
				title: "Inspect Privacy Policies & Tracker Leaks",
				description:
					"Identifies third-party tracking scripts, cookie compliance, and data exfiltration vectors.",
				inputs: {
					targetUrl: userGoal.includes("http")
						? userGoal
						: "https://open-agentic-web.org",
					auditLevel: "strict",
				},
				dependencies: auditDeps,
				status: "pending",
				requiredPermissions: ["network:fetch", "dom:read"],
			});
		}

		// Stage 3: Consensus Fact Checking on the collective findings
		if (wantsFact || tasks.length > 1) {
			const allPrevDeps = tasks.map((t) => t.id);
			tasks.push({
				id: `task_${stepIndex++}_consensus`,
				agentId: "did:web:truth-consensus.org",
				capabilityId: "verify_claims_consensus",
				title: "Cross-Agent Consensus & Veracity Certification",
				description:
					"Cross-references all gathered findings against decentralized consensus nodes to certify veracity.",
				inputs: {
					statement: `Findings for goal: "${userGoal}" verified by decentralized multi-agent mesh.`,
					domainContext: "Open Agentic Web Interoperability",
				},
				dependencies: allPrevDeps,
				status: "pending",
				requiredPermissions: ["network:fetch"],
			});
		}

		// Collect unique permissions
		const permissionSet = new Set<PermissionType>();
		tasks.forEach((t) =>
			t.requiredPermissions.forEach((p) => permissionSet.add(p)),
		);

		// Topological sort (already naturally organized in staged dependency order)
		const resolvedOrder = tasks.map((t) => t.id);

		return {
			id: planId,
			userGoal,
			createdAt: new Date().toISOString(),
			tasks,
			resolvedOrder,
			totalEstimatedPermissions: Array.from(permissionSet),
		};
	}

	/**
	 * Executes a plan step-by-step with Human-in-the-loop permission checking
	 */
	public static async execute(
		plan: MeshPlan,
		permissions: PermissionController,
		onStepUpdate?: (task: MeshTask) => void,
	): Promise<{ plan: MeshPlan; receipt: VerifiableReceipt }> {
		const executedTasks: {
			taskId: string;
			agentId: string;
			capabilityId: string;
			inputs: Record<string, unknown>;
			outputs?: Record<string, unknown>;
			durationMs: number;
			status: TaskStatus;
		}[] = [];

		// Context dictionary to pass outputs from previous tasks into subsequent tasks
		const contextStore: Record<string, Record<string, unknown>> = {};

		for (const taskId of plan.resolvedOrder) {
			const task = plan.tasks.find((t) => t.id === taskId);
			if (!task) continue;

			const registered = AgentRegistry.get(task.agentId);
			const agentName = registered ? registered.card.name : task.agentId;

			// Check / request user permissions
			if (task.requiredPermissions.length > 0) {
				task.status = "requesting_permission";
				onStepUpdate?.(task);

				const allowed = await permissions.requestPermissions(
					task.agentId,
					agentName,
					task.requiredPermissions,
					`Execute capability '${task.capabilityId}' for task: ${task.title}`,
				);

				if (!allowed) {
					task.status = "denied";
					task.error = "User denied requested permissions in security gate.";
					onStepUpdate?.(task);
					executedTasks.push({
						taskId: task.id,
						agentId: task.agentId,
						capabilityId: task.capabilityId,
						inputs: task.inputs,
						outputs: undefined,
						durationMs: 0,
						status: "denied",
					});
					break; // Stop downstream execution safely
				}
			}

			// Inject prior task outputs if applicable
			const enrichedInputs = { ...task.inputs };
			task.dependencies.forEach((depId) => {
				if (contextStore[depId]) {
					enrichedInputs[`prior_${depId}_summary`] = contextStore[depId];
				}
			});

			task.status = "running";
			onStepUpdate?.(task);

			const resp = await WebMCPClient.invoke({
				agentId: task.agentId,
				capabilityId: task.capabilityId,
				inputs: enrichedInputs,
			});

			task.executionTimeMs = resp.durationMs;

			if (resp.success) {
				task.status = "completed";
				task.outputs = resp.outputs;
				contextStore[task.id] = resp.outputs || {};
			} else {
				task.status = "failed";
				task.error = resp.error;
			}

			onStepUpdate?.(task);

			executedTasks.push({
				taskId: task.id,
				agentId: task.agentId,
				capabilityId: task.capabilityId,
				inputs: enrichedInputs,
				outputs: task.outputs,
				durationMs: task.executionTimeMs || 0,
				status: task.status,
			});

			if (task.status === "failed") {
				break; // Stop cascade if a critical prerequisite fails
			}
		}

		const receipt = await AgentCrypto.createReceipt(
			plan.id,
			plan.userGoal,
			executedTasks,
		);

		return { plan, receipt };
	}
}
