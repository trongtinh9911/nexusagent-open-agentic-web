import { AgentRegistry } from "../agents/builtins";

export interface WebMCPInvocationRequest {
	agentId: string;
	capabilityId: string;
	inputs: Record<string, unknown>;
	sandboxConfig?: {
		timeoutMs?: number;
		allowDomAccess?: boolean;
	};
}

export interface WebMCPInvocationResponse {
	success: boolean;
	outputs?: Record<string, unknown>;
	error?: string;
	durationMs: number;
	timestamp: string;
}

export class WebMCPClient {
	public static async invoke(
		request: WebMCPInvocationRequest,
	): Promise<WebMCPInvocationResponse> {
		const startTime = performance.now();
		const registered = AgentRegistry.get(request.agentId);

		if (!registered) {
			return {
				success: false,
				error: `Agent '${request.agentId}' is not registered in the local WebMCP mesh.`,
				durationMs: 0,
				timestamp: new Date().toISOString(),
			};
		}

		const capability = registered.card.capabilities.find(
			(c) => c.id === request.capabilityId,
		);
		if (!capability) {
			return {
				success: false,
				error: `Capability '${request.capabilityId}' not found on agent '${registered.card.name}'.`,
				durationMs: 0,
				timestamp: new Date().toISOString(),
			};
		}

		try {
			// Execute within client-side sandbox
			const outputs = await registered.executor(request.inputs);
			const durationMs = Math.round(performance.now() - startTime);

			return {
				success: true,
				outputs,
				durationMs,
				timestamp: new Date().toISOString(),
			};
		} catch (err: unknown) {
			const durationMs = Math.round(performance.now() - startTime);
			return {
				success: false,
				error: err instanceof Error ? err.message : String(err),
				durationMs,
				timestamp: new Date().toISOString(),
			};
		}
	}
}
