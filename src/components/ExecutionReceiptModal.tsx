import {
	Check,
	Copy,
	Download,
	Hash,
	KeyRound,
	ShieldCheck,
	X,
} from "lucide-react";
import React from "react";
import type { VerifiableReceipt } from "../types/mesh";

interface ExecutionReceiptModalProps {
	receipt: VerifiableReceipt | null;
	onClose: () => void;
}

export const ExecutionReceiptModal: React.FC<ExecutionReceiptModalProps> = ({
	receipt,
	onClose,
}) => {
	const [copied, setCopied] = React.useState(false);

	if (!receipt) return null;

	const handleCopy = () => {
		navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownload = () => {
		const blob = new Blob([JSON.stringify(receipt, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${receipt.receiptId}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-slate-900 border border-emerald-500/40 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative glow-emerald max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex items-start justify-between pb-4 border-b border-slate-800">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
							<ShieldCheck className="w-5 h-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<h3 className="text-base font-bold text-white">
									Verifiable Execution Receipt
								</h3>
								<span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
									W3C Provenance
								</span>
							</div>
							<p className="text-xs text-slate-400 font-mono mt-0.5">
								{receipt.receiptId}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
					{/* Metadata Grid */}
					<div className="grid grid-cols-2 gap-3 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 font-mono">
						<div>
							<span className="text-slate-500 block text-[10px] uppercase">
								Client DID
							</span>
							<span
								className="text-slate-300 text-xs truncate block"
								title={receipt.clientDid}
							>
								{receipt.clientDid}
							</span>
						</div>
						<div>
							<span className="text-slate-500 block text-[10px] uppercase">
								Timestamp
							</span>
							<span className="text-slate-300 text-xs">
								{new Date(receipt.timestamp).toLocaleString()}
							</span>
						</div>
						<div className="col-span-2">
							<span className="text-slate-500 block text-[10px] uppercase">
								User Prompt Goal
							</span>
							<span className="text-emerald-400 text-xs block italic truncate">
								{receipt.userGoal}
							</span>
						</div>
					</div>

					{/* Cryptographic Proof */}
					<div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 space-y-2">
						<div className="flex items-center gap-2 text-cyan-400 font-semibold">
							<KeyRound className="w-4 h-4" />
							<span>Cryptographic Proof Vector</span>
						</div>
						<div>
							<span className="text-slate-500 block text-[10px] uppercase font-mono">
								Merkle Tree Root (SHA-256)
							</span>
							<code className="text-xs text-amber-300 break-all block bg-slate-900 p-1.5 rounded mt-0.5 font-mono">
								{receipt.cryptographicProof.merkleRoot}
							</code>
						</div>
						<div>
							<span className="text-slate-500 block text-[10px] uppercase font-mono">
								Autonomous Node Signature
							</span>
							<code className="text-xs text-cyan-300 break-all block bg-slate-900 p-1.5 rounded mt-0.5 font-mono">
								{receipt.cryptographicProof.signature}
							</code>
						</div>
					</div>

					{/* Task receipts list */}
					<div>
						<label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
							Chained Task Receipts ({receipt.taskReceipts.length}):
						</label>
						<div className="space-y-2">
							{receipt.taskReceipts.map((task, i) => (
								<div
									key={task.taskId}
									className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 flex items-center justify-between gap-4 font-mono text-[11px]"
								>
									<div>
										<div className="flex items-center gap-2">
											<span className="text-slate-500">#{i + 1}</span>
											<span className="text-emerald-400 font-semibold">
												{task.capabilityId}
											</span>
											<span className="text-slate-500 text-[10px]">
												({task.agentId})
											</span>
										</div>
										<div className="text-slate-400 text-[10px] mt-1 flex gap-3">
											<span>In: {task.inputHash.slice(0, 10)}...</span>
											<span>Out: {task.outputHash.slice(0, 10)}...</span>
										</div>
									</div>
									<div className="text-right shrink-0">
										<span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
											{task.durationMs}ms
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Footer actions */}
				<div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
					<span className="text-[11px] text-slate-500 flex items-center gap-1">
						<Hash className="w-3.5 h-3.5" /> Immutable Verification Record
					</span>
					<div className="flex items-center gap-2">
						<button
							onClick={handleCopy}
							className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
						>
							{copied ? (
								<Check className="w-3.5 h-3.5 text-emerald-400" />
							) : (
								<Copy className="w-3.5 h-3.5" />
							)}
							{copied ? "Copied JSON" : "Copy JSON"}
						</button>
						<button
							onClick={handleDownload}
							className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow-sm"
						>
							<Download className="w-3.5 h-3.5" />
							Download Receipt (.json)
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
