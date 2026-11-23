# PLAN.md: NexusAgent — Open Agentic Web Mesh & Verification Protocol

## 1. Executive Summary & Hackathon Alignment
- **Competition:** Open Agentic Web Challenge (Cognizant AI Lab × Mozilla × AWS × MIT Media Lab NANDA)
- **Prize Track:** $13,000 Global Open Agentic Infrastructure & Agentic Websites
- **Core Vision:** Break free from proprietary agent walled gardens (OpenAI GPTs, Anthropic Artifacts) by creating an open, decentralized, browser-native agent discovery, verification, and mesh orchestration protocol.
- **Key Principles:**
  - **Open Standards (MIT NANDA & W3C):** Standardized `/.well-known/agent.json` specification with cryptographic identity (DIDs) and schema validation.
  - **User Control & Privacy (Mozilla):** 100% client-side execution, explicit permission boundaries (Human-In-The-Loop gate), zero server-side telemetry.
  - **Interoperability (WebMCP):** Model Context Protocol adapted for web workers, iframes, and cross-origin postMessage.
  - **Public Good (UN SDG Alignment):** Out-of-the-box agents for carbon footprint auditing, fact-checking consensus, and privacy transparency.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NexusAgent In-Browser OS                        │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │  Agent Discovery Hub  │  │         Agent Manifest Studio         │  │
│  │ (Query .well-known/   │  │ (Author, Validate & Sign agent.json)  │  │
│  │  agent.json from web) │  └───────────────────────────────────────┘  │
│  └──────────┬────────────┘                      │                      │
│             │                                   ▼                      │
│  ┌──────────▼───────────────────────────────────────────────────────┐  │
│  │             Decentralized Mesh Orchestrator (DAG Engine)         │  │
│  │   - Capability matching   - Dependency resolution                │  │
│  │   - Cross-agent data flow - Execution receipts                   │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │             Mozilla Human-In-The-Loop Security Boundary          │  │
│  │      [DOM Access: Ask] [Network: Whitelist] [Storage: Ephemeral] │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                    WebMCP In-Browser Runtime                     │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────┐  │  │
│  │  │ Eco-Tracker   │ │ Fact-Checker  │ │ Privacy-Shield│ │Custom│  │  │
│  │  │ (Carbon/Energy)│ │ (Consensus)   │ │ (PII/Tracking)│ │Agents│  │  │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └──────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Modules & Implementation Structure

```
open-agentic-web/
├── PLAN.md                               # This architecture blueprint
├── README.md                             # Comprehensive technical documentation & quickstart
├── package.json                          # Vite, React, TypeScript, Vitest, Lucide
├── tsconfig.json                         # Strict TypeScript configuration
├── vite.config.ts                        # Fast Vite bundler config
├── public/
│   └── .well-known/
│       └── agent.json                    # Dogfooding: NexusAgent's own agent card
├── src/
│   ├── types/
│   │   ├── agent-card.ts                 # Full TypeScript interfaces for Agent Card v1.0
│   │   ├── mesh.ts                       # DAG, Task, ExecutionStep, Receipt types
│   │   └── security.ts                   # Permission models, sandbox policies
│   ├── schemas/
│   │   └── agent-card.schema.json        # W3C/NANDA compliant JSON-Schema
│   ├── sdk/
│   │   ├── validator.ts                  # In-browser schema validation
│   │   ├── crypto.ts                     # DID Key generator, SHA-256 signing & receipts
│   │   ├── web-mcp.ts                    # In-browser WebMCP client/server abstraction
│   │   ├── orchestrator.ts               # Autonomous DAG task execution engine
│   │   └── permissions.ts                # Human-in-the-loop permission gate
│   ├── agents/
│   │   ├── builtins.ts                   # 4 pre-registered public-good web agents
│   │   ├── eco-tracker-agent.ts          # Carbon & energy auditor agent
│   │   ├── fact-checker-agent.ts         # Consensus veracity agent
│   │   └── privacy-shield-agent.ts       # Tracker & PII auditing agent
│   ├── components/
│   │   ├── Navigation.tsx                # Distinctive header with system status
│   │   ├── DiscoveryHub.tsx              # Browse, inspect, and add agent cards
│   │   ├── MeshOrchestratorView.tsx      # DAG visualizer, live prompt runner
│   │   ├── ManifestStudio.tsx            # Interactive JSON/visual authoring tool
│   │   ├── SecurityGateModal.tsx         # Mozilla-style transparent permission prompt
│   │   ├── ExecutionReceiptModal.tsx     # Verifiable cryptographic execution proof
│   │   └── EmbedCodeModal.tsx            # 30-second website integration snippet
│   ├── App.tsx                           # Master UI with tabs & state management
│   ├── main.tsx                          # React entrypoint
│   └── index.css                         # Clean, purposeful styling (Solarized/Cyber)
└── tests/
    ├── validator.test.ts                 # Validates agent.json schemas
    ├── crypto.test.ts                    # Verifies DID, hashing, receipts
    ├── orchestrator.test.ts              # DAG planning & task chaining tests
    ├── permissions.test.ts               # Permission boundary & rejection tests
    └── builtin-agents.test.ts            # Tests all 4 built-in agents execution
```

---

## 4. Test & Verification Plan
1. `npm test`: Runs Vitest across 5 test suites (20+ tests covering schema validation, DAG resolution, cryptographic receipts, security gates, and agent execution).
2. `npm run build`: Type-checks and bundles production assets into `dist/` with 0 warnings or errors.
3. Verification receipts: Tests produce verifiable cryptographic execution hashes.
