import type { AgentCard } from "../types/agent-card";
import { EcoTrackerCard, executeEcoTracker } from "./eco-tracker-agent";
import { executeFactChecker, FactCheckerCard } from "./fact-checker-agent";
import {
	executePrivacyShield,
	PrivacyShieldCard,
} from "./privacy-shield-agent";
import {
	executeWebResearcher,
	WebResearcherCard,
} from "./web-researcher-agent";

export interface RegisteredAgent {
	card: AgentCard;
	executor: (
		inputs: Record<string, unknown>,
	) => Promise<Record<string, unknown>>;
}

export const BUILTIN_AGENTS: RegisteredAgent[] = [
	{ card: EcoTrackerCard, executor: executeEcoTracker },
	{ card: FactCheckerCard, executor: executeFactChecker },
	{ card: PrivacyShieldCard, executor: executePrivacyShield },
	{ card: WebResearcherCard, executor: executeWebResearcher },
];

export class AgentRegistry {
	private static agents: Map<string, RegisteredAgent> = new Map(
		BUILTIN_AGENTS.map((a) => [a.card.id, a]),
	);

	public static getAll(): AgentCard[] {
		return Array.from(this.agents.values()).map((a) => a.card);
	}

	public static get(agentId: string): RegisteredAgent | undefined {
		return this.agents.get(agentId);
	}

	public static register(
		card: AgentCard,
		executor?: (
			inputs: Record<string, unknown>,
		) => Promise<Record<string, unknown>>,
	): void {
		const existing = this.agents.get(card.id);
		const resolvedExecutor =
			executor ||
			existing?.executor ||
			(async (inputs) => ({
				status: "simulated_success",
				agentId: card.id,
				inputsReceived: inputs,
				message: `Executed capability in client sandbox without external telemetry.`,
			}));
		this.agents.set(card.id, { card, executor: resolvedExecutor });
	}

	public static resetToBuiltins(): void {
		this.agents = new Map(BUILTIN_AGENTS.map((a) => [a.card.id, a]));
	}
}
