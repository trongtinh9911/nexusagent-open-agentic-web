import type { MeshTask } from "../types/mesh";

export type NetworkProvenanceMode = "live_network_fetch" | "cors_fallback";

export interface NetworkProvenanceInfo {
	mode: NetworkProvenanceMode;
	badgeLabel: "LIVE NETWORK FETCH" | "CORS FALLBACK";
	sourceDetail: string;
	httpStatus?: number;
	endpointUrl?: string;
}

/**
 * Resolves transparent network provenance (LIVE NETWORK FETCH vs CORS FALLBACK)
 * directly from MeshTask.networkMode / MeshTask.dataSource and agent outputs.
 */
export function resolveNetworkProvenance(
	task: Pick<MeshTask, "outputs" | "status" | "networkMode" | "dataSource">,
): NetworkProvenanceInfo | null {
	if (task.status !== "completed" || !task.outputs) {
		return null;
	}

	const out = task.outputs as Record<string, unknown>;
	const endpointRaw =
		out.fetchedUrl ?? out.sourceUrl ?? out.targetUrl ?? out.domain;
	const endpointUrl =
		typeof endpointRaw === "string" && endpointRaw.length > 0
			? endpointRaw
			: undefined;

	const httpStatusRaw = out.httpStatus ?? out.statusCode;
	const httpStatus =
		typeof httpStatusRaw === "number" ? httpStatusRaw : undefined;

	// Primary SDK contract on MeshTask & agent outputs (supports both SPACE and UNDERSCORE variants)
	const declaredMode =
		task.networkMode ??
		task.dataSource ??
		(typeof out.networkMode === "string" ? out.networkMode : undefined) ??
		(typeof out.dataSource === "string" ? out.dataSource : undefined);

	const normalizedDeclared = String(declaredMode ?? "")
		.replace(/_/g, " ")
		.trim()
		.toUpperCase();

	if (normalizedDeclared === "LIVE NETWORK FETCH") {
		const sourceLabel = String(
			out.verifiedBy ?? endpointUrl ?? "Public Web Endpoint",
		);
		return {
			mode: "live_network_fetch",
			badgeLabel: "LIVE NETWORK FETCH",
			sourceDetail: httpStatus
				? `HTTP ${httpStatus} live browser network probe (${sourceLabel})`
				: `Live browser network fetch succeeded (${sourceLabel})`,
			httpStatus,
			endpointUrl,
		};
	}

	if (normalizedDeclared === "CORS FALLBACK") {
		return {
			mode: "cors_fallback",
			badgeLabel: "CORS FALLBACK",
			sourceDetail: String(
				out.fallbackReason ??
					"Browser CORS / offline policy prevented direct fetch; deterministic local heuristic applied transparently.",
			),
			httpStatus,
			endpointUrl,
		};
	}

	// Fallback check for custom/third-party agents
	const normalized = normalizedDeclared.toLowerCase();
	if (normalized.includes("live") || out.isLiveFetch === true) {
		return {
			mode: "live_network_fetch",
			badgeLabel: "LIVE NETWORK FETCH",
			sourceDetail: `Live browser network fetch (${endpointUrl ?? "web endpoint"})`,
			httpStatus,
			endpointUrl,
		};
	}

	return {
		mode: "cors_fallback",
		badgeLabel: "CORS FALLBACK",
		sourceDetail:
			"Browser CORS / sandbox policy blocked direct third-party response; deterministic local heuristic applied transparently.",
		httpStatus,
		endpointUrl,
	};
}
