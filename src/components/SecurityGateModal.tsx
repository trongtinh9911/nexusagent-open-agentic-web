import { Check, Lock, ShieldAlert, ShieldCheck, X } from "lucide-react";
import type React from "react";
import type { PermissionDecision, PermissionRequest } from "../types/security";

interface SecurityGateModalProps {
	request: PermissionRequest | null;
	onDecision: (decision: PermissionDecision) => void;
}

export const SecurityGateModal: React.FC<SecurityGateModalProps> = ({
	request,
	onDecision,
}) => {
	if (!request) return null;

	return (
		<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-slate-900 border border-amber-500/40 rounded-xl max-w-lg w-full p-6 shadow-2xl relative glow-amber">
				{/* Header */}
				<div className="flex items-start gap-4">
					<div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
						<ShieldAlert className="w-6 h-6 animate-pulse" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
								Mozilla Human-In-The-Loop Boundary
							</span>
						</div>
						<h3 className="text-lg font-bold text-white mt-1">
							Permission Authorization Required
						</h3>
						<p className="text-xs text-slate-400 mt-0.5">
							An autonomous web agent is requesting execution privileges on your
							browser.
						</p>
					</div>
				</div>

				{/* Agent details */}
				<div className="mt-5 bg-slate-950/60 rounded-lg p-3.5 border border-slate-800 text-xs">
					<div className="flex justify-between items-center pb-2 border-b border-slate-800">
						<span className="text-slate-400">Requesting Agent:</span>
						<span className="font-semibold text-white">
							{request.agentName}
						</span>
					</div>
					<div className="flex justify-between items-center py-2 border-b border-slate-800">
						<span className="text-slate-400">DID Identifier:</span>
						<span className="font-mono text-emerald-400 truncate max-w-[260px]">
							{request.agentId}
						</span>
					</div>
					<div className="pt-2">
						<span className="text-slate-400 block mb-1">Declared Purpose:</span>
						<p className="text-slate-200 italic bg-slate-900 p-2 rounded border border-slate-800/80">
							"{request.purpose}"
						</p>
					</div>
				</div>

				{/* Requested privileges */}
				<div className="mt-4">
					<label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
						Requested Privileges ({request.permissions.length}):
					</label>
					<div className="space-y-2">
						{request.permissions.map((perm) => (
							<div
								key={perm}
								className="flex items-center gap-2.5 p-2 rounded bg-slate-800/50 border border-slate-700/60 text-xs text-slate-200"
							>
								<Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
								<span className="font-mono text-amber-300 font-medium">
									{perm}
								</span>
								<span className="text-slate-400 text-[11px] ml-auto">
									{perm === "network:fetch"
										? "Allows read-only queries to target web endpoints"
										: perm === "dom:read"
											? "Inspects public HTML structure of active tab"
											: "Accesses local ephemeral sandbox"}
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Action buttons */}
				<div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
					<button
						onClick={() => onDecision("deny")}
						className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center gap-1.5"
					>
						<X className="w-3.5 h-3.5" />
						Deny & Block
					</button>

					<button
						onClick={() => onDecision("grant_once")}
						className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition flex items-center gap-1.5"
					>
						<Check className="w-3.5 h-3.5" />
						Grant Once
					</button>

					<button
						onClick={() => onDecision("grant_session")}
						className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow-sm"
					>
						<ShieldCheck className="w-4 h-4" />
						Authorize For Session
					</button>
				</div>
			</div>
		</div>
	);
};
