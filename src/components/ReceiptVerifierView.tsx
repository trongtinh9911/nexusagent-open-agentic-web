import {
	AlertTriangle,
	CheckCircle2,
	FileCheck2,
	FlaskConical,
	Hash,
	KeyRound,
	RotateCcw,
	ShieldAlert,
	ShieldCheck,
	Sparkles,
	XCircle,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { VerifiableReceipt } from "../types/mesh";
import {
	generateSampleSignedReceipt,
	type ReceiptVerificationResult,
	simulateReceiptTamper,
	type TamperSimulationResult,
	verifyExecutionReceipt,
} from "./receiptVerifier";

interface ReceiptVerifierViewProps {
	initialReceipt?: VerifiableReceipt | null;
	latestMeshReceipt?: VerifiableReceipt | null;
}

export const ReceiptVerifierView: React.FC<ReceiptVerifierViewProps> = ({
	initialReceipt,
	latestMeshReceipt,
}) => {
	const [receiptJson, setReceiptJson] = useState<string>("");
	const [originalCleanJson, setOriginalCleanJson] = useState<string>("");
	const [result, setResult] = useState<ReceiptVerificationResult | null>(null);
	const [tamperInfo, setTamperInfo] = useState<TamperSimulationResult | null>(
		null,
	);
	const [isVerifying, setIsVerifying] = useState(false);

	const runVerify = async (jsonText: string) => {
		setIsVerifying(true);
		try {
			const res = await verifyExecutionReceipt(jsonText);
			setResult(res);
		} finally {
			setIsVerifying(false);
		}
	};

	// Auto-load initialReceipt if navigated from ExecutionReceiptModal, otherwise generate a real signed sample receipt
	useEffect(() => {
		let cancelled = false;
		const loadInitial = async () => {
			const seedReceipt =
				initialReceipt ??
				latestMeshReceipt ??
				(await generateSampleSignedReceipt());
			if (cancelled) return;
			const formatted = JSON.stringify(seedReceipt, null, 2);
			setReceiptJson(formatted);
			setOriginalCleanJson(formatted);
			setTamperInfo(null);
			await runVerify(formatted);
		};
		loadInitial();
		return () => {
			cancelled = true;
		};
	}, [initialReceipt, latestMeshReceipt]);

	const handleLoadSample = async () => {
		const sample = await generateSampleSignedReceipt();
		const formatted = JSON.stringify(sample, null, 2);
		setReceiptJson(formatted);
		setOriginalCleanJson(formatted);
		setTamperInfo(null);
		await runVerify(formatted);
	};

	const handleLoadLatestMesh = async () => {
		if (!latestMeshReceipt) return;
		const formatted = JSON.stringify(latestMeshReceipt, null, 2);
		setReceiptJson(formatted);
		setOriginalCleanJson(formatted);
		setTamperInfo(null);
		await runVerify(formatted);
	};

	const handleSimulateTamper = async () => {
		try {
			// Save clean snapshot before first tamper if not yet stored
			const baseJson = tamperInfo
				? originalCleanJson || receiptJson
				: receiptJson;
			if (!tamperInfo) {
				setOriginalCleanJson(receiptJson);
			}
			const tampered = simulateReceiptTamper(baseJson);
			setReceiptJson(tampered.tamperedJson);
			setTamperInfo(tampered);
			await runVerify(tampered.tamperedJson);
		} catch (err: unknown) {
			setResult({
				valid: false,
				tampered: false,
				parseError: `Cannot simulate tamper on invalid JSON: ${err instanceof Error ? err.message : String(err)}`,
				summary: "Fix JSON syntax before simulating tamper.",
				checks: [],
				verifiedAt: new Date().toISOString(),
			});
		}
	};

	const handleRestoreOriginal = async () => {
		if (!originalCleanJson) return;
		setReceiptJson(originalCleanJson);
		setTamperInfo(null);
		await runVerify(originalCleanJson);
	};

	return (
		<div className="space-y-6">
			{/* Top header & action bar */}
			<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
				<div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
					<div>
						<h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
							<ShieldCheck className="w-4 h-4 text-emerald-400" />
							Cryptographic Execution Receipt Verifier
						</h2>
						<p className="text-xs text-slate-400 mt-0.5">
							Paste any NexusAgent JSON Execution Receipt to independently
							recompute SHA-256 Merkle Tree &amp; node signatures in your
							browser (zero server trust).
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						{latestMeshReceipt && (
							<button
								onClick={handleLoadLatestMesh}
								className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 transition flex items-center gap-1.5"
							>
								<FileCheck2 className="w-3.5 h-3.5" />
								Load Latest Mesh Receipt
							</button>
						)}

						<button
							onClick={handleLoadSample}
							className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
						>
							<Sparkles className="w-3.5 h-3.5 text-cyan-400" />
							Load Signed Sample
						</button>

						<button
							onClick={handleSimulateTamper}
							className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/50 transition flex items-center gap-1.5"
						>
							<FlaskConical className="w-3.5 h-3.5 text-rose-400" />
							Simulate Tamper (Flip 1 Char)
						</button>

						{tamperInfo && (
							<button
								onClick={handleRestoreOriginal}
								className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1.5"
							>
								<RotateCcw className="w-3.5 h-3.5" />
								Restore Authentic
							</button>
						)}

						<button
							onClick={() => runVerify(receiptJson)}
							disabled={isVerifying}
							className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow-sm"
						>
							<ShieldCheck className="w-3.5 h-3.5" />
							{isVerifying ? "Verifying..." : "Verify SHA-256 & Signature"}
						</button>
					</div>
				</div>

				{/* Tamper simulation notice */}
				{tamperInfo && (
					<div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2.5">
						<AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
						<div>
							<span className="font-bold text-rose-300 uppercase tracking-wide text-[11px] block">
								Tamper Injection Active — 1 Character Mutated
							</span>
							<p className="mt-0.5 font-mono text-[11px] text-rose-200/90">
								{tamperInfo.description}
							</p>
						</div>
					</div>
				)}

				{/* Verification verdict banner */}
				{result && (
					<div
						className={`mt-4 p-4 rounded-xl border transition-all ${
							result.valid
								? "bg-emerald-950/30 border-emerald-500/50 glow-emerald"
								: "bg-rose-950/35 border-rose-500/60 glow-rose"
						}`}
					>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								{result.valid ? (
									<div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
										<CheckCircle2 className="w-6 h-6" />
									</div>
								) : (
									<div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
										<ShieldAlert className="w-6 h-6 animate-pulse" />
									</div>
								)}
								<div>
									<div className="flex items-center gap-2">
										<span
											className={`text-sm font-bold tracking-wide ${
												result.valid ? "text-emerald-300" : "text-rose-300"
											}`}
										>
											{result.valid
												? "CRYPTOGRAPHIC PROOF VERIFIED"
												: result.parseError
													? "INVALID RECEIPT PAYLOAD"
													: "TAMPER DETECTED — PROOF REJECTED"}
										</span>
										<span
											className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
												result.valid
													? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
													: "bg-rose-500/20 text-rose-300 border border-rose-500/40"
											}`}
										>
											{result.valid ? "SHA-256 PASS" : "INTEGRITY FAILURE"}
										</span>
									</div>
									<p className="text-xs text-slate-300 mt-0.5">
										{result.parseError || result.summary}
									</p>
								</div>
							</div>

							<span className="text-[10px] font-mono text-slate-400">
								Verified locally at{" "}
								{new Date(result.verifiedAt).toLocaleTimeString()}
							</span>
						</div>
					</div>
				)}

				{/* Two-column layout: JSON Input + Cryptographic Proof Audit */}
				<div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
					{/* Left: JSON Receipt Editor */}
					<div className="flex flex-col">
						<div className="flex items-center justify-between mb-2">
							<label
								htmlFor="receipt-json-input"
								className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"
							>
								<Hash className="w-3.5 h-3.5 text-cyan-400" />
								Execution Receipt JSON Input
							</label>
							<span className="text-[10px] font-mono text-slate-500">
								Edit any character to test live avalanche detection
							</span>
						</div>
						<textarea
							id="receipt-json-input"
							value={receiptJson}
							onChange={(e) => {
								setReceiptJson(e.target.value);
								setTamperInfo(null);
							}}
							rows={22}
							placeholder='Paste any Verifiable Execution Receipt JSON here (e.g. from "View Cryptographic Proof Receipt" -> "Copy JSON")...'
							className="w-full flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-3.5 font-mono text-[11px] text-slate-200 focus:outline-none transition leading-relaxed"
							spellCheck={false}
						/>
					</div>

					{/* Right: Step-by-Step Cryptographic Breakdown */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
								<KeyRound className="w-3.5 h-3.5 text-emerald-400" />
								In-Browser Cryptographic Verification Matrix
							</span>
							{result && result.checks.length > 0 && (
								<span className="text-[11px] font-mono text-slate-400">
									{result.checks.filter((c) => c.passed).length}/
									{result.checks.length} Passed
								</span>
							)}
						</div>

						{result && result.checks.length > 0 ? (
							<div className="space-y-2.5">
								{result.checks.map((check) => (
									<div
										key={check.id}
										className={`p-3 rounded-lg border text-xs ${
											check.passed
												? "bg-slate-950/80 border-emerald-500/30"
												: "bg-rose-950/25 border-rose-500/50"
										}`}
									>
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2">
												{check.passed ? (
													<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
												) : (
													<XCircle className="w-4 h-4 text-rose-400 shrink-0" />
												)}
												<span className="font-semibold text-white">
													{check.label}
												</span>
											</div>
											<span
												className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
													check.passed
														? "bg-emerald-500/15 text-emerald-300"
														: "bg-rose-500/20 text-rose-300"
												}`}
											>
												{check.passed ? "MATCH" : "MISMATCH"}
											</span>
										</div>
										<p className="text-[11px] text-slate-400 mt-1">
											{check.detail}
										</p>
										{!check.passed && check.expected && check.actual && (
											<div className="mt-2 pt-2 border-t border-rose-500/20 space-y-1 font-mono text-[10px]">
												<div className="text-emerald-300 break-all">
													<span className="text-slate-500">Recomputed: </span>
													{check.expected}
												</div>
												<div className="text-rose-300 break-all">
													<span className="text-slate-500">In Receipt: </span>
													{check.actual}
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						) : (
							<div className="p-6 rounded-lg bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
								Paste a valid Execution Receipt JSON and click{" "}
								<strong className="text-slate-300">
									Verify SHA-256 &amp; Signature
								</strong>{" "}
								to inspect Merkle tree integrity.
							</div>
						)}

						{/* Chained Leaf Summary */}
						{result?.receipt && (
							<div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
								<span className="text-[10px] font-mono uppercase text-slate-500 block">
									Verified Chained Task Leaves (
									{result.receipt.taskReceipts.length})
								</span>
								<div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
									{result.receipt.taskReceipts.map((t, i) => (
										<div
											key={`${t.taskId}-${i}`}
											className="p-2 rounded bg-slate-900/90 border border-slate-800/80 font-mono text-[10px] flex flex-wrap items-center justify-between gap-2"
										>
											<span className="text-emerald-400 font-semibold">
												#{i + 1} {t.capabilityId}
											</span>
											<span className="text-slate-400 truncate max-w-[260px]">
												out:{t.outputHash.slice(0, 16)}...
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};
