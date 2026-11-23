import type { AgentCard } from "../types/agent-card";

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
}

export class AgentCardValidator {
	public static validate(data: unknown): ValidationResult {
		const errors: string[] = [];
		const warnings: string[] = [];

		if (!data || typeof data !== "object") {
			return {
				isValid: false,
				errors: ["Manifest must be a non-null JSON object."],
				warnings: [],
			};
		}

		const card = data as Partial<AgentCard>;

		// Required fields
		if (card.schemaVersion !== "1.0.0") {
			errors.push("schemaVersion must strictly be '1.0.0'.");
		}

		if (!card.id || typeof card.id !== "string") {
			errors.push(
				"id is required and must be a valid identifier (e.g. DID or URI).",
			);
		} else if (
			!card.id.startsWith("did:") &&
			!card.id.startsWith("agent://") &&
			!card.id.startsWith("https://")
		) {
			warnings.push(
				"id should ideally follow W3C DID format (e.g. did:web:... or did:key:...) for interoperability.",
			);
		}

		if (
			!card.name ||
			typeof card.name !== "string" ||
			card.name.trim().length === 0
		) {
			errors.push("name is required and cannot be empty.");
		}

		if (!card.description || typeof card.description !== "string") {
			errors.push("description is required.");
		}

		if (!card.provider || typeof card.provider !== "object") {
			errors.push("provider object is required with name and url.");
		} else {
			if (!card.provider.name) errors.push("provider.name is required.");
			if (!card.provider.url) errors.push("provider.url is required.");
		}

		if (!Array.isArray(card.protocols) || card.protocols.length === 0) {
			warnings.push(
				"protocols array is recommended to declare compatibility (e.g., 'webmcp/1.0', 'nanda/0.2').",
			);
		}

		if (!Array.isArray(card.capabilities) || card.capabilities.length === 0) {
			errors.push(
				"Agent must declare at least one capability in the capabilities array.",
			);
		} else {
			card.capabilities.forEach((cap, idx) => {
				if (!cap.id)
					errors.push(`Capability at index ${idx} is missing an 'id'.`);
				if (!cap.name)
					errors.push(`Capability at index ${idx} is missing a 'name'.`);
				if (!cap.description)
					errors.push(`Capability at index ${idx} is missing a 'description'.`);
				if (!cap.inputSchema || typeof cap.inputSchema !== "object") {
					errors.push(
						`Capability '${cap.id || idx}' must define an 'inputSchema' object.`,
					);
				}
				if (!Array.isArray(cap.permissionsRequired)) {
					errors.push(
						`Capability '${cap.id || idx}' must declare 'permissionsRequired' array (can be empty).`,
					);
				}
			});
		}

		if (!card.security || typeof card.security !== "object") {
			warnings.push(
				"security object should be defined to specify sandboxLevel and provenance.",
			);
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Fetches and validates a live agent manifest from an endpoint (e.g. ./.well-known/agent.json)
	 */
	public static async discoverLiveManifest(
		url = "./.well-known/agent.json",
	): Promise<{
		success: boolean;
		card?: AgentCard;
		validation: ValidationResult;
		source: string;
		error?: string;
	}> {
		try {
			const res = await fetch(url, { headers: { Accept: "application/json" } });
			if (!res.ok) {
				return {
					success: false,
					source: url,
					validation: {
						isValid: false,
						errors: [`HTTP error ${res.status}: ${res.statusText}`],
						warnings: [],
					},
					error: `Failed to fetch manifest from ${url}: HTTP ${res.status}`,
				};
			}
			const data = await res.json();
			const validation = this.validate(data);
			return {
				success: validation.isValid,
				card: data as AgentCard,
				validation,
				source: url,
			};
		} catch (err: unknown) {
			const errMsg = err instanceof Error ? err.message : String(err);
			return {
				success: false,
				source: url,
				validation: { isValid: false, errors: [errMsg], warnings: [] },
				error: errMsg,
			};
		}
	}
}
