# NexusAgent: Open, Decentralized In-Browser Agent Discovery & Mesh Orchestration Protocol

**Submission for the Open Agentic Web Challenge**  
*Organized by Cognizant AI Lab in partnership with Mozilla, AWS, and MIT Media Lab NANDA.*

---

## 1. Vision & Core Philosophy

Today's agent ecosystem is rapidly centralizing into proprietary corporate silos (OpenAI GPT Stores, Anthropic Artifacts, closed platform plugins). This centralization locks developers into proprietary runtimes, charges rent on agent discovery, compromises user privacy, and creates single points of failure.

**NexusAgent** breaks this paradigm by implementing the foundational infrastructure for a truly **Open Agentic Web**:
- **Decentralized Discovery:** Websites publish machine-readable capability manifests at `/.well-known/agent.json` following the open Agent Card v1.0 standard.
- **Client-Side Sovereignty (Zero Cloud Lock-in):** Autonomous agents discover, negotiate, and execute directly inside browser Web Workers and WebMCP sandboxes without leaking telemetry to central servers.
- **Mozilla Human-In-The-Loop Boundary:** Complete user transparency. No agent can read DOM structure, cookies, or make outbound network calls without explicit, granular user authorization.
- **Verifiable Proof of Execution:** Every multi-agent DAG execution generates a cryptographic receipt backed by SHA-256 Merkle trees and W3C DIDs (`did:key:...`), providing verifiable provenance.

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
│  │   - Intent compiler       - Dependency topological sort          │  │
│  │   - Cross-agent data flow - Merkle proof receipt generator       │  │
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

## 3. Four Public-Good Built-In Agents

NexusAgent comes pre-loaded with four production-ready web agents serving global social good and open web trust:

| Agent Name | W3C DID Identifier | Primary Capability | Public Good Alignment |
|---|---|---|---|
| **EcoTracker** | `did:web:eco-tracker.org` | `compute_carbon_footprint` | Measures page weight, kWh, and CO2 emissions per interaction (UN SDG 13: Climate Action). |
| **TruthMesh Fact-Checker** | `did:web:truth-consensus.org` | `verify_claims_consensus` | Cross-references statements against decentralized consensus nodes to certify veracity. |
| **PrivacyShield** | `did:web:privacy-shield.org` | `audit_trackers_and_pii` | Inspects third-party tracking scripts, fingerprinting, and enforces Mozilla privacy policies. |
| **Cognizant Researcher** | `did:web:cognizant-research.org` | `synthesize_research_brief` | Autonomous multi-angle web synthesizer extracting actionable insights and citations. |

---

## 4. Agentify Any Website in 30 Seconds

Turn any web property into an autonomous, agent-ready service:

### Step 1: Place `agent.json` at your web root
```json
{
  "schemaVersion": "1.0.0",
  "id": "did:web:yourdomain.com",
  "name": "Your Autonomous Service",
  "version": "1.0.0",
  "description": "Exposes structured query and calculation tools to autonomous web agents.",
  "protocols": ["webmcp/1.0", "nanda/0.2", "w3c-did/v1"],
  "capabilities": [
    {
      "id": "query_service",
      "name": "Query Live Service",
      "description": "Allows search agents to discover live catalog items.",
      "inputSchema": { "type": "object", "properties": { "query": { "type": "string" } } },
      "permissionsRequired": ["network:fetch"]
    }
  ]
}
```

### Step 2: Add discovery tag to HTML `<head>`
```html
<link rel="agent-manifest" type="application/json" href="/.well-known/agent.json" />
```

---

## 5. Quickstart & Verification

```bash
# Clone and enter the repository
cd open-agentic-web

# Install dependencies
npm install

# Run automated test suites (18 tests across schema, DAG, crypto, permissions)
npm test

# Build production bundle with strict TypeScript verification
npm run build

# Start local interactive developer server
npm run dev
```

---

## 6. Verification Receipts & Cryptographic Proof

Every multi-agent execution generates an immutable receipt structured as follows:

```json
{
  "receiptId": "rcpt_a9f8b2c1d0e3",
  "planId": "plan_1732356789_x9k2",
  "userGoal": "Audit website for carbon emissions and privacy",
  "timestamp": "2026-11-23T10:15:00.000Z",
  "clientDid": "did:key:z6Mkq5Xz...clientKey",
  "cryptographicProof": {
    "hashAlgorithm": "SHA-256",
    "merkleRoot": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "signature": "sig_ed25519_8f29...proof"
  },
  "taskReceipts": [
    {
      "taskId": "task_1_research",
      "agentId": "did:web:cognizant-research.org",
      "inputHash": "3b29...",
      "outputHash": "7c12...",
      "durationMs": 42,
      "status": "completed"
    }
  ]
}
```

---

## 7. License

Released under the **MIT License**. Open source for all developers, researchers, and public-good initiatives worldwide.
