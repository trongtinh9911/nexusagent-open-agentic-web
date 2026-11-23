import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock,
	FileCheck2,
	Layers,
	Play,
	RefreshCw,
	ShieldAlert,
	Terminal,
	Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { AgentRegistry } from "../agents/builtins";
import { MeshOrchestrator } from "../sdk/orchestrator";
import type { PermissionController } from "../sdk/permissions";
import type { MeshPlan, VerifiableReceipt } from "../types/mesh";

interface MeshOrchestratorViewProps {
	permissionController: PermissionController;
	onOpenReceipt: (receipt: VerifiableReceipt) => void;
}

export const MeshOrchestratorView: React.FC<MeshOrchestratorViewProps> = ({
	permissionController,
	onOpenReceipt,
}) => {
	const [userGoal, setUserGoal] = useState<string>(
		"Audit e-commerce site for carbon emissions, third-party tracking scripts, and verify claims",
	);
	const [currentPlan, setCurrentPlan] = useState<MeshPlan | null>(null);
	const [isExecuting, setIsExecuting] = useState(false);
	const [activeReceipt, setActiveReceipt] = useState<VerifiableReceipt | null>(
		null,
	);
	const [logs, setLogs] = useState<string[]>([]);
	const [expandedTaskOutputs, setExpandedTaskOutputs] = useState<
		Record<string, boolean>
	>({});

	const presetGoals = [
		{
			label: "Full Web Audit (Eco + Privacy + Fact)",
			prompt:
				"Comprehensive audit for carbon emissions, third-party tracking scripts, and verify claims veracity",
		},
		{
			label: "Green Computing Footprint",
			prompt:
				"Calculate carbon footprint and energy kilowatt-hours for cloud web workflows",
		},
		{
			label: "Privacy & Anti-Tracking Shield",
			prompt:
				"Audit target website for invasive canvas fingerprinting, meta trackers, and PII leaks",
		},
		{
			label: "Decentralized Research Synthesis",
			prompt:
				"Synthesize decentralized agent web standards, W3C DID, and WebMCP interoperability",
		},
	];

	const handlePlanAndRun = async () => {
		if (!userGoal.trim() || isExecuting) return;

		setLogs([]);
		setActiveReceipt(null);
		setIsExecuting(true);

		addLog(
			`[SYSTEM] Compiling decentralized agent DAG for goal: "${userGoal}"`,
		);
		const compiledPlan = MeshOrchestrator.plan(userGoal);
		setCurrentPlan(compiledPlan);

		addLog(
			`[PLANNER] Generated ${compiledPlan.tasks.length} autonomous tasks across decentralized mesh.`,
		);
		compiledPlan.tasks.forEach((t, i) => {
			addLog(`  -> Step ${i + 1}: [${t.agentId}] ${t.title}`);
		});

		try {
			const { plan: finishedPlan, receipt } = await MeshOrchestrator.execute(
				compiledPlan,
				permissionController,
				(updatedTask) => {
					setCurrentPlan((prev) => {
						if (!prev) return null;
						return {
							...prev,
							tasks: prev.tasks.map((t) =>
								t.id === updatedTask.id ? { ...updatedTask } : t,
							),
						};
					});

					if (updatedTask.status === "running") {
						addLog(
							`[EXEC] Invoking capability '${updatedTask.capabilityId}' on ${updatedTask.agentId}...`,
						);
					} else if (updatedTask.status === "completed") {
						addLog(
							`[SUCCESS] Task '${updatedTask.id}' finished in ${updatedTask.executionTimeMs}ms.`,
						);
					} else if (updatedTask.status === "denied") {
						addLog(
							`[SECURITY] Task '${updatedTask.id}' blocked by Mozilla Human-in-the-loop Gate.`,
						);
					}
				},
			);

			setCurrentPlan(finishedPlan);
			setActiveReceipt(receipt);
			addLog(
				`[VERIFY] Cryptographic Merkle Root generated: ${receipt.cryptographicProof.merkleRoot}`,
			);
			addLog(`[DONE] Autonomous multi-agent pipeline completed successfully!`);
		} catch (err: unknown) {
			addLog(
				`[ERROR] Execution failed: ${err instanceof Error ? err.message : String(err)}`,
			);
		} finally {
			setIsExecuting(false);
		}
	};

	const addLog = (msg: string) => {
		setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
	};

	const toggleOutput = (taskId: string) => {
		setExpandedTaskOutputs((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
	};

	return (
		<div className="space-y-6">
			{/* Input panel */}
			<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<Zap className="w-4 h-4 text-emerald-400" />
						<h2 className="text-sm font-bold text-white uppercase tracking-wider">
							Autonomous Mesh Goal Planner
						</h2>
					</div>
					<span className="text-[11px] text-slate-400 font-mono">
						Direct Web-Agent Interoperability
					</span>
				</div>

				{/* Preset tags */}
				<div className="flex flex-wrap items-center gap-2 mb-3">
					<span className="text-xs text-slate-500 font-medium">
						Quick Presets:
					</span>
					{presetGoals.map((p, idx) => (
						<button
							key={idx}
							onClick={() => setUserGoal(p.prompt)}
							className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
						>
							{p.label}
						</button>
					))}
				</div>

				{/* Input box */}
				<div className="flex gap-2">
					<input
						type="text"
						value={userGoal}
						onChange={(e) => setUserGoal(e.target.value)}
						placeholder="Type any high-level user goal (e.g. Audit website for carbon and privacy)..."
						className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition font-mono"
						onKeyDown={(e) => e.key === "Enter" && handlePlanAndRun()}
					/>
					<button
						onClick={handlePlanAndRun}
						disabled={isExecuting}
						className={`px-5 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 shrink-0 ${
							isExecuting
								? "bg-slate-800 text-slate-500 cursor-not-allowed"
								: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm"
						}`}
					>
						{isExecuting ? (
							<>
								<RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
								Executing Mesh...
							</>
						) : (
							<>
								<Play className="w-4 h-4 fill-slate-950" />
								Compile & Run DAG
							</>
						)}
					</button>
				</div>
			</div>

			{/* DAG Visualization and Execution Progress */}
			{currentPlan && (
				<div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
					<div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
						<div className="flex items-center gap-2">
							<Layers className="w-4 h-4 text-cyan-400" />
							<h3 className="text-sm font-bold text-white">
								Multi-Agent Dependency DAG ({currentPlan.tasks.length} Nodes)
							</h3>
						</div>
						{activeReceipt && (
							<button
								onClick={() => onOpenReceipt(activeReceipt)}
								className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition flex items-center gap-1.5"
							>
								<FileCheck2 className="w-3.5 h-3.5" />
								View Cryptographic Proof Receipt
							</button>
						)}
					</div>

					{/* Nodes list / Flow */}
					<div className="space-y-3">
						{currentPlan.tasks.map((task, index) => {
							const registered = AgentRegistry.get(task.agentId);
							const isExpanded = expandedTaskOutputs[task.id];

							return (
								<div
									key={task.id}
									className={`border rounded-lg p-4 transition-all ${
										task.status === "running"
											? "bg-slate-950 border-cyan-500/60 glow-cyan"
											: task.status === "completed"
												? "bg-slate-950/80 border-emerald-500/30"
												: task.status === "requesting_permission"
													? "bg-slate-950 border-amber-500/60 glow-amber animate-pulse"
													: task.status === "denied"
														? "bg-slate-950/60 border-rose-500/40"
														: "bg-slate-950/40 border-slate-800"
									}`}
								>
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div className="flex items-center gap-3">
											{/* Step badge */}
											<span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-mono text-xs font-semibold shrink-0">
												{index + 1}
											</span>

											{/* Status icon */}
											{task.status === "completed" ? (
												<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
											) : task.status === "running" ? (
												<RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
											) : task.status === "requesting_permission" ? (
												<ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
											) : task.status === "denied" ? (
												<AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
											) : (
												<Clock className="w-4 h-4 text-slate-600 shrink-0" />
											)}

											<div>
												<div className="flex items-center gap-2">
													<h4 className="text-xs font-bold text-white">
														{task.title}
													</h4>
													<span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
														{registered?.card.name || task.agentId}
													</span>
												</div>
												<p className="text-[11px] text-slate-400 mt-0.5">
													{task.description}
												</p>
											</div>
										</div>

										<div className="flex items-center gap-3">
											{/* Permissions tags */}
											{task.requiredPermissions.map((perm) => (
												<span
													key={perm}
													className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700"
												>
													{perm}
												</span>
											))}

											{/* Duration */}
											{task.executionTimeMs !== undefined && (
												<span className="text-[10px] font-mono text-emerald-400 font-semibold">
													{task.executionTimeMs}ms
												</span>
											)}

											{/* Status pill */}
											<span
												className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
													task.status === "completed"
														? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
														: task.status === "running"
															? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
															: task.status === "requesting_permission"
																? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
																: task.status === "denied"
																	? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
																	: "bg-slate-800 text-slate-400"
												}`}
											>
												{task.status}
											</span>

											{/* Output toggle button */}
											{task.outputs && (
												<button
													onClick={() => toggleOutput(task.id)}
													className="text-xs text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
												>
													{isExpanded ? (
														<ChevronDown className="w-4 h-4" />
													) : (
														<ChevronRight className="w-4 h-4" />
													)}
												</button>
											)}
										</div>
									</div>

									{/* Expandable output display */}
									{isExpanded && task.outputs && (
										<div className="mt-3 pt-3 border-t border-slate-800/80">
											<span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
												Execution Result Vector:
											</span>
											<pre className="bg-slate-900 p-2.5 rounded text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48 border border-slate-800">
												{JSON.stringify(task.outputs, null, 2)}
											</pre>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Live In-Browser Execution Terminal */}
			<div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg font-mono">
				<div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400">
					<div className="flex items-center gap-2">
						<Terminal className="w-3.5 h-3.5 text-emerald-400" />
						<span className="font-semibold text-slate-300">
							In-Browser WebMCP Console
						</span>
					</div>
					<span className="text-[10px] text-slate-600">
						Client-Side Isolation
					</span>
				</div>
				<div className="space-y-1 text-xs max-h-48 overflow-y-auto pr-1">
					{logs.length === 0 ? (
						<span className="text-slate-600 italic">
							Mesh idle. Enter a prompt above and click "Compile & Run DAG" to
							start autonomous orchestration.
						</span>
					) : (
						logs.map((log, i) => (
							<div
								key={i}
								className={
									log.includes("[SUCCESS]")
										? "text-emerald-400"
										: log.includes("[SECURITY]")
											? "text-amber-400"
											: log.includes("[ERROR]")
												? "text-rose-400"
												: log.includes("[EXEC]")
													? "text-cyan-400"
													: "text-slate-400"
								}
							>
								{log}
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};
