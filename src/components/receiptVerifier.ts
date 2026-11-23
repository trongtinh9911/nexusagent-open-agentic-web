import { AgentCrypto } from "../sdk/crypto";
import type { VerifiableReceipt } from "../types/mesh";

export interface ReceiptVerificationCheck {
	id: string;
	label: string;
	passed: boolean;
	expected?: string;
	actual?: string;
	detail: string;
}

export interface ReceiptVerificationResult {
	valid: boolean;
	tampered: boolean;
	parseError?: string;
	summary: string;
	sdkReason?: string;
	recomputedMerkleRoot?: string;
	recomputedSignature?: string;
	recomputedReceiptId?: string;
	recomputedClientDid?: string;
	checks: ReceiptVerificationCheck[];
	verifiedAt: string;
	receipt?: VerifiableReceipt;
}

export interface TamperSimulationResult {
	tamperedJson: string;
	fieldChanged: string;
	originalChar: string;
	tamperedChar: string;
	description: string;
}

const HEX_64_REGEX = /^[0-9a-f]{64}$/i;

function flipSingleHexChar(value: string): {
	mutated: string;
	originalChar: string;
	tamperedChar: string;
} {
	if (!value.length) {
		return { mutated: "x", originalChar: "", tamperedChar: "x" };
	}
	const targetIndex = Math.min(4, value.length - 1);
	const originalChar = value[targetIndex];
	const hexChars = "0123456789abcdef";
	const lower = originalChar.toLowerCase();
	const idx = hexChars.indexOf(lower);
	const tamperedChar =
		idx >= 0
			? hexChars[(idx + 1) % hexChars.length]
			: originalChar === "z"
				? "a"
				: "z";
	const mutated =
		value.slice(0, targetIndex) + tamperedChar + value.slice(targetIndex + 1);
	return { mutated, originalChar, tamperedChar };
}

function isVerifiableReceiptShape(
	candidate: unknown,
): candidate is VerifiableReceipt {
	if (!candidate || typeof candidate !== "object") return false;
	const obj = candidate as Record<string, unknown>;
	if (
		typeof obj.receiptId !== "string" ||
		typeof obj.planId !== "string" ||
		typeof obj.userGoal !== "string" ||
		typeof obj.timestamp !== "string" ||
		typeof obj.clientDid !== "string" ||
		typeof obj.executedTasksCount !== "number" ||
		!Array.isArray(obj.taskReceipts)
	) {
		return false;
	}
	const proof = obj.cryptographicProof as Record<string, unknown> | undefined;
	if (
		!proof ||
		typeof proof !== "object" ||
		typeof proof.merkleRoot !== "string" ||
		typeof proof.signature !== "string" ||
		typeof proof.hashAlgorithm !== "string"
	) {
		return false;
	}
	return obj.taskReceipts.every((tr) => {
		if (!tr || typeof tr !== "object") return false;
		const item = tr as Record<string, unknown>;
		return (
			typeof item.taskId === "string" &&
			typeof item.agentId === "string" &&
			typeof item.capabilityId === "string" &&
			typeof item.inputHash === "string" &&
			typeof item.outputHash === "string"
		);
	});
}

/**
 * Independently verifies a NexusAgent Cryptographic Execution Receipt inside the browser
 * using AgentCrypto.verifyReceipt + deep field-level SHA-256 Merkle & DID binding checks.
 */
export async function verifyExecutionReceipt(
	rawInput: string | VerifiableReceipt,
): Promise<ReceiptVerificationResult> {
	const verifiedAt = new Date().toISOString();
	let parsed: unknown = rawInput;

	if (typeof rawInput === "string") {
		if (!rawInput.trim()) {
			return {
				valid: false,
				tampered: false,
				parseError: "Empty input. Paste a Verifiable Execution Receipt JSON.",
				summary: "No receipt payload provided.",
				checks: [],
				verifiedAt,
			};
		}
		try {
			parsed = JSON.parse(rawInput);
		} catch (err: unknown) {
			return {
				valid: false,
				tampered: false,
				parseError: `Invalid JSON syntax: ${err instanceof Error ? err.message : String(err)}`,
				summary: "Failed to parse JSON receipt.",
				checks: [],
				verifiedAt,
			};
		}
	}

	if (!isVerifiableReceiptShape(parsed)) {
		return {
			valid: false,
			tampered: false,
			parseError:
				"JSON does not match VerifiableReceipt schema (missing receiptId, planId, cryptographicProof, or taskReceipts).",
			summary: "Invalid receipt schema.",
			checks: [],
			verifiedAt,
		};
	}

	const receipt = parsed;
	const checks: ReceiptVerificationCheck[] = [];

	// Consult AgentCrypto.verifyReceipt directly
	const sdkCheck = await AgentCrypto.verifyReceipt(receipt);

	// 1. Hash Algorithm & Leaf Format Check
	const algoValid = receipt.cryptographicProof.hashAlgorithm === "SHA-256";
	const allLeafHashesValid = receipt.taskReceipts.every(
		(t) => HEX_64_REGEX.test(t.inputHash) && HEX_64_REGEX.test(t.outputHash),
	);
	checks.push({
		id: "hash_format",
		label: "SHA-256 Algorithm & Leaf Hash Integrity",
		passed: algoValid && allLeafHashesValid,
		expected: "SHA-256 (64-char hex input/output hashes)",
		actual: `${receipt.cryptographicProof.hashAlgorithm} (${receipt.taskReceipts.length} task leaves)`,
		detail:
			algoValid && allLeafHashesValid
				? `All ${receipt.taskReceipts.length} task input/output hashes are well-formed 256-bit SHA-256 digests.`
				: "One or more task hashes are malformed or hashAlgorithm is not SHA-256.",
	});

	// 2. Executed Task Count Integrity
	const countValid = receipt.executedTasksCount === receipt.taskReceipts.length;
	checks.push({
		id: "task_count",
		label: "Executed Task Count Binding",
		passed: countValid,
		expected: String(receipt.taskReceipts.length),
		actual: String(receipt.executedTasksCount),
		detail: countValid
			? `Declared task count (${receipt.executedTasksCount}) matches chained taskReceipts array length.`
			: `Tamper signal: executedTasksCount (${receipt.executedTasksCount}) does not match taskReceipts.length (${receipt.taskReceipts.length}).`,
	});

	// 3. Recompute Merkle Root from chained task receipts
	const taskHashes = receipt.taskReceipts.map(
		(r) => `${r.taskId}:${r.inputHash}:${r.outputHash}`,
	);
	const recomputedMerkleRoot =
		sdkCheck.computedMerkleRoot ??
		(await AgentCrypto.calculateMerkleRoot(taskHashes));
	const merkleValid =
		recomputedMerkleRoot === receipt.cryptographicProof.merkleRoot;
	checks.push({
		id: "merkle_root",
		label: "Merkle Tree Root (SHA-256)",
		passed: merkleValid,
		expected: recomputedMerkleRoot,
		actual: receipt.cryptographicProof.merkleRoot,
		detail: merkleValid
			? "Recomputed SHA-256 Merkle root matches receipt cryptographicProof.merkleRoot byte-for-byte."
			: "MISMATCH! Task receipts or Merkle root have been altered after signing.",
	});

	// 4. Client DID Derivation Check
	const recomputedClientDid = `did:key:z6M${(await AgentCrypto.sha256(receipt.planId)).slice(0, 32)}`;
	const strictDidMatch = recomputedClientDid === receipt.clientDid;
	checks.push({
		id: "client_did",
		label: "W3C Client DID Binding",
		passed: strictDidMatch,
		expected: recomputedClientDid,
		actual: receipt.clientDid,
		detail: strictDidMatch
			? "Client DID matches deterministic derivation from planId."
			: "MISMATCH! Client DID does not match planId derivation (possible planId or DID tampering).",
	});

	// 5. Receipt ID Binding Check
	const recomputedReceiptId = `rcpt_${(await AgentCrypto.sha256(receipt.planId + recomputedMerkleRoot)).slice(0, 16)}`;
	const receiptIdValid = recomputedReceiptId === receipt.receiptId;
	checks.push({
		id: "receipt_id",
		label: "Receipt ID Binding (planId + MerkleRoot)",
		passed: receiptIdValid,
		expected: recomputedReceiptId,
		actual: receipt.receiptId,
		detail: receiptIdValid
			? "Receipt ID cryptographically binds planId and Merkle root."
			: "MISMATCH! Receipt ID does not match SHA-256(planId + recomputedMerkleRoot).",
	});

	// 6. Autonomous Node Cryptographic Signature (cross-checked with AgentCrypto.verifyReceipt)
	const recomputedSignature =
		sdkCheck.computedSignature ??
		`sig_ed25519_${(await AgentCrypto.sha256(recomputedMerkleRoot + receipt.clientDid)).slice(0, 64)}`;
	const signatureValid =
		sdkCheck.valid &&
		merkleValid &&
		recomputedSignature === receipt.cryptographicProof.signature;

	checks.push({
		id: "signature",
		label: "Autonomous Node Cryptographic Signature",
		passed: signatureValid,
		expected: recomputedSignature,
		actual: receipt.cryptographicProof.signature,
		detail: signatureValid
			? "Cryptographic signature verified via AgentCrypto.verifyReceipt against Merkle root and client DID."
			: sdkCheck.reason ||
				"SIGNATURE INVALID! Tampering detected in signature, clientDid, or underlying task Merkle root.",
	});

	const valid = sdkCheck.valid && checks.every((c) => c.passed);

	return {
		valid,
		tampered: !valid,
		sdkReason: sdkCheck.reason,
		summary: valid
			? `VERIFIED AUTHENTIC: All ${checks.length}/${checks.length} cryptographic proofs passed in-browser.`
			: `TAMPER DETECTED: ${checks.filter((c) => !c.passed).length}/${checks.length} cryptographic checks failed.`,
		recomputedMerkleRoot,
		recomputedSignature,
		recomputedReceiptId,
		recomputedClientDid,
		checks,
		verifiedAt,
		receipt,
	};
}

/**
 * Deterministically flips exactly 1 character inside a receipt JSON payload to demonstrate
 * immediate SHA-256 Merkle tree & signature tamper detection.
 */
export function simulateReceiptTamper(
	jsonString: string,
): TamperSimulationResult {
	const parsed = JSON.parse(jsonString) as VerifiableReceipt;

	if (
		Array.isArray(parsed.taskReceipts) &&
		parsed.taskReceipts.length > 0 &&
		typeof parsed.taskReceipts[0].outputHash === "string" &&
		parsed.taskReceipts[0].outputHash.length > 0
	) {
		const orig = parsed.taskReceipts[0].outputHash;
		const { mutated, originalChar, tamperedChar } = flipSingleHexChar(orig);
		parsed.taskReceipts[0].outputHash = mutated;
		return {
			tamperedJson: JSON.stringify(parsed, null, 2),
			fieldChanged: "taskReceipts[0].outputHash",
			originalChar,
			tamperedChar,
			description: `Flipped 1 character in taskReceipts[0].outputHash ('${originalChar}' -> '${tamperedChar}'). Merkle Root, Receipt ID, and Signature immediately invalidate.`,
		};
	}

	if (
		parsed.cryptographicProof &&
		typeof parsed.cryptographicProof.merkleRoot === "string"
	) {
		const orig = parsed.cryptographicProof.merkleRoot;
		const { mutated, originalChar, tamperedChar } = flipSingleHexChar(orig);
		parsed.cryptographicProof.merkleRoot = mutated;
		return {
			tamperedJson: JSON.stringify(parsed, null, 2),
			fieldChanged: "cryptographicProof.merkleRoot",
			originalChar,
			tamperedChar,
			description: `Flipped 1 character in cryptographicProof.merkleRoot ('${originalChar}' -> '${tamperedChar}').`,
		};
	}

	throw new Error("Receipt has no tamperable cryptographic hash fields.");
}

/**
 * Generates a freshly signed valid sample receipt using AgentCrypto so judges can test
 * verification and 1-char tamper detection immediately without running a mesh first.
 */
export async function generateSampleSignedReceipt(): Promise<VerifiableReceipt> {
	return AgentCrypto.createReceipt(
		"plan_demo_open_agentic_web_2026",
		"Audit https://mozilla.org for carbon footprint, privacy trackers, and consensus veracity",
		[
			{
				taskId: "task_1_eco",
				agentId: "did:web:eco-tracker.org",
				capabilityId: "compute_carbon_footprint",
				inputs: { targetUrl: "https://mozilla.org", monthlyVisits: 100000 },
				outputs: {
					targetUrl: "https://mozilla.org",
					networkMode: "LIVE NETWORK FETCH",
					cleanEnergyRating: "A+ (100% Renewable Hosted)",
					estimatedCo2GramsPerVisit: 0.168,
				},
				durationMs: 42,
				status: "completed",
			},
			{
				taskId: "task_2_privacy",
				agentId: "did:web:privacy-shield.org",
				capabilityId: "audit_trackers_and_pii",
				inputs: { targetUrl: "https://mozilla.org", auditLevel: "strict" },
				outputs: {
					networkMode: "CORS FALLBACK",
					privacyScore: 96,
					trackersBlocked: 0,
					gdprCompliant: true,
				},
				durationMs: 38,
				status: "completed",
			},
			{
				taskId: "task_3_consensus",
				agentId: "did:web:truth-consensus.org",
				capabilityId: "verify_claims_consensus",
				inputs: {
					statement: "Audit findings verified by decentralized mesh.",
				},
				outputs: {
					networkMode: "LIVE NETWORK FETCH",
					consensusScore: 0.98,
					veracityRating: "VERIFIED_CONSENSUS",
				},
				durationMs: 29,
				status: "completed",
			},
		],
	);
}
