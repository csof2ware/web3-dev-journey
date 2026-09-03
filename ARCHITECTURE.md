# 🏗️ Architecture — Airdrop Platform

> *Purpose*: End-to-end airdrop distribution system demonstrating production Web3 patterns: high-throughput claim processing, on-chain verification, privacy-preserving proofs, and gasless UX. Built as a reference architecture for DAO governance primitives (the same Merkle/nonce/voucher patterns power CondoDAO, Gitcoin Passport, and most token distributions).

---

## 1. Context & Motivation

Token distribution is a coordination problem. Three failures dominate the space:

1. *Gas-prohibitive batch claims*: naive transfer() per user costs ~50k gas × N users.
2. *Sybil abuse*: anyone can claim multiple times if eligibility is only checked off-chain.
3. *Centralized issuance*: a backend that can mint at will is a single point of corruption.

This platform resolves all three with primitives that compose into larger governance systems:

| Problem | Primitive |
|---|---|
| Gas cost | Merkle proofs → 1 tx for N claims |
| Sybil | On-chain used[nonce] registry + EIP-712 domain separation |
| Centralized issuance | onlyOwner + timelock + event transparency |

These same primitives, applied to condo votes (CondoDAO), produce *verifiable ballots with no central tallying authority* — the motivation behind this codebase.

---

## 2. High-Level Architecture

┌─────────────────────────────────────────────────────────────────────────┐
│                          USERS (browser)                                |
|                                                                                    
│                         MetaMask + HTML/JS                              │
└───────────────────────────────┬─────────────────────────────────────────┘
│ POST /claim · GET /voucher/:addr
▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API LAYER (Express)                            │
│  rate limit (sliding window) → dedup (set) → verify proof → enqueue     │
└──────────────┬──────────────────────────────────────┬───────────────────┘
│                                      │
▼                                      ▼
┌─────────────┐                      ┌────────────────┐
│    Redis    │                      │  PostgreSQL    │
│  claims:q   │                      │  events/holders│
│  claimed:s  │                      │                │
│  rl:*:zset  │                      └───────┬────────┘
└──────┬──────┘                              │
│ BLPOP                               │ write
▼                                      │
┌─────────────┐                               │
│   Worker    │ ──────── batch(50) ─────────┐ │
└─────────────┘                             ▼ ▼
┌────────────────┐
│   Hardhat /    │
│   L1 chain     │
│  (AirdropToken │
│   MerkleAirdrop│
│   SignedAirdrop│
│   GaslessAirdrop│
│   ZKAirdrop)   │
└───────┬────────┘
│ events
▼
┌────────────────┐
│    Indexer     │
│ (event-driven) │
└───────┬────────┘
│
▼
┌────────────────┐
│  Read model    │
│  (Postgres)    │
└────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│                   OBSERVABILITY                                         │
│   /health (liveness) · /metrics (Prometheus text) · Grafana dashboards  │
└─────────────────────────────────────────────────────────────────────────┘


















## 3. Component Specifications

### 3.1 Smart Contracts

| Contract | Purpose | Gas Profile |
|---|---|---|
| AirdropToken (ERC-1155) | Multi-token base; holds minted badges | ~50k mint |
| MerkleAirdrop | Batch claims via Merkle proofs | ~80k per claim (proof verify + mint) |
| SignedAirdrop | Voucher claims via EIP-712 authority signatures | ~75k per claim |
| GaslessAirdrop | Relayer-sponsored claims (Day 16, stub) | — |
| ZKAirdrop | Privacy-preserving claims via nullifiers (Day 17, stub) | — |

All inherit Ownable (OpenZeppelin). In production, replace with AccessControl + TimelockController.

### 3.2 API Layer (Express)

Single service, stateless, horizontally scalable behind a load balancer.

*Endpoints*:
- POST /claim — Merkle claim (queued)
- GET /voucher/:addr — issue EIP-712 voucher (rate-limited)
- GET /proof/:addr — fetch Merkle proof for an eligible address
- GET /config — public contract addresses + Merkle root
- GET /holders — top-N leaderboard (SQL)
- GET /holders/:addr — single holder balance
- GET /stats — aggregate counts
- GET /health — liveness probe (Redis + Postgres + RPC)
- GET /metrics — Prometheus-formatted counters

*Middleware*:
- express.json() — request parsing
- express.static("frontend") — serves the dashboard SPA
- Prometheus counter middleware (increments airdrop_requests_total per request)

### 3.3 Worker

Long-running process. Consumes Redis queue via BLPOP, batches up to 50 addresses, submits 1 tx per batch. *Key property*: at most 1 in-flight tx per worker; multiple workers scale throughput linearly.

*Failure modes*:
- RPC fails → retry with exponential backoff, switch provider (rpc.js failover)
- Tx reverts → log, re-enqueue the addresses, alert via metrics
- Worker crashes → orchestrator restarts (liveness probe)

### 3.4 Indexer (event-driven)

Reads TransferSingle events from the chain, writes to the Postgres read model via UPSERT (ON CONFLICT DO UPDATE). Idempotent: resumes from MAX(block_number) stored in the events table.

Two modes:
- *Catch-up*: queryFilter(from, to) for past events
- *Live*: contract.on("TransferSingle") for real-time updates

### 3.5 Storage

| Store | Role | Justification |
|---|---|---|
| Redis | Queue, rate-limit windows, dedup sets, nonces | Sub-ms latency; atomic primitives (ZADD, SADD, INCR) |
| PostgreSQL | Read model (holders, events) | ACID for financial data; SQL for leaderboards |
| IPFS (kubo) | NFT metadata | Content-addressed, decentralized, {id}.json URI template |
| Chain | Source of truth | Immutable; everything else is a derived view |

---

## 4. Data Flow — Claim Lifecycle

1.User submits POST /claim { address, proof }
2.API:
rate limit check (sliding window ZSET, 5 req/10s)
dedup check (Redis set "claimed")
off-chain Merkle verify (mirror of on-chain algorithm)
RPUSH to "claims" list + SADD "claimed"
respond 202 Queued (< 50ms)
3.Worker BLPOP pops from queue
4.Worker batches up to 50 addresses
5.Worker calls MerkleAirdrop.claimBatch(addresses[]) — 1 tx
6.Chain emits N TransferSingle events
7.Indexer detects events, writes to Postgres (events + holders UPSERT)
8./stats and /holders reflect the change

*Latency breakdown*: API response <50ms; tx confirmation 2-3 blocks (~30s on mainnet, ~2s on testnets); dashboard refresh ~5s.

## 5. Architectural Decision Records (ADRs)

### ADR-001: Redis over Kafka
*Context*: queue + rate limit.
*Decision*: Redis sorted sets + lists.
*Trade-off*: simpler ops, lower latency, fits throughput target (1000 req/s). Kafka is more durable and scalable but introduces ops overhead unjustified at this scale.
*Migration path*: if throughput exceeds 100k/s, introduce Kafka/Kinesis for the queue while keeping Redis for rate limit.

### ADR-002: PostgreSQL over MongoDB
*Context*: store holder balances and event log.
*Decision*: PostgreSQL with BIGINT balances.
*Trade-off*: ACID compliance prevents balance drift from partial writes. MongoDB's flexibility is unnecessary; relational schema matches the domain.
*Note*: node-postgres returns BIGINT as string to prevent precision loss; the API surfaces these as strings.

### ADR-003: Custom indexer alongside The Graph
*Context*: read model for holders.
*Decision*: run both.
*Rationale*: custom indexer enables business logic (dedup, rate limit, cache); The Graph provides the standard GraphQL API that third-party clients expect. They share the same event source (chain) and write to separate stores (Postgres vs Graph Node's internal schema).
*Status*: Graph Node setup pending (Postgres migration issues with deployment_schemas); revisit with a clean postgres:13 + graph-node:v0.35.0 pairing.

### ADR-004: EIP-712 over raw signatures
*Context*: off-chain authorization.
*Decision*: typed-data signatures with domain separator.
*Rationale*: users see readable "Claim 1 token for 0x..." in MetaMask instead of hex blobs; domain separator prevents cross-chain/cross-contract replay. Matches Uniswap permit, Optimism airdrop.

### ADR-005: Merkle proofs over on-chain allowlist
*Context*: N eligible addresses.
*Decision*: 32-byte root + per-user proof.
*Trade-off*: 1000 addresses on-chain = 20M gas deploy; Merkle root = 32 bytes. 400× cheaper. Proofs are ~320 bytes (10 levels) per claim.
*Regeneration*: re-running setupBackend regenerates config.json with new root when allowlist changes.

### ADR-006: Multi-stage Dockerfile.prod
*Context*: production image.
*Decision*: build stage with npm ci, runtime stage copies only node_modules + source.
*Benefit*: image ~300MB vs ~1.2GB; no build tools, no devDeps, smaller attack surface.

---

## 6. Security Model

### 6.1 Threat Model

| Threat | Mitigation |
|---|---|
| Replay of valid signatures | used[nonce] + EIP-712 domain separator |
| Sybil claims | On-chain claimed[address] + off-chain allowlist |
| Abuse of /voucher endpoint | Sliding window rate limit (5 req/10s/address) |
| Compromised authority key | setAuthority() restricted to onlyOwner; rotate on breach |
| Reentrancy | OpenZeppelin patterns (no external calls between state changes) |
| Front-running claims | Acceptable (claim is idempotent); private mempool not needed |
| DDoS on /claim | Rate limit per IP + per address; Redis absorbs spikes |

### 6.2 Known Vulnerabilities (Day 16/17 stubs)

*Day 16 — GaslessAirdrop*: the "signature" is keccak256(abi.encode(to)), which is computable by anyone. In production, replace with real ECDSA/EIP-712 signature by the relayer authority.

*Day 17 — ZKAirdrop*: verifyProof returns true unconditionally. In production, replace with a Groth16 verifier contract (e.g., generated by snarkjs from a Circom circuit) and a proper Poseidon-based Merkle tree.

These are intentionally marked as stubs to demonstrate architecture without a working cryptographic backend. Both should be hardened before mainnet use.

---

## 7. Observability

### 7.1 Healthchecks

/health probes three dependencies in parallel:
- Redis: PING
- Postgres: SELECT 1
- RPC: eth_blockNumber

Returns 200 + {"healthy": true} only if all three pass. Returns 503 otherwise. Kubernetes liveness probes restart containers on 503.

### 7.2 Metrics (Prometheus text format)

airdrop_requests_total 
airdrop_claims_queued 
airdrop_claims_dup 
airdrop_claims_invalid 
airdrop_claims_rate_limited 
airdrop_queue_length

Scraped every 15s by Prometheus; visualized in Grafana dashboards.

### 7.3 Logging

console.log for now. Production upgrade path: structured JSON logs → Datadog / Loki / CloudWatch Logs.

---

## 8. Deployment Topology

### Local (this repo)
docker compose up spins up 7 services: dev, redis, postgres, graph-postgres, ipfs, graph-node (pending), plus host-bound hardhat node.

### Production (reference)

Load Balancer (Cloudflare / nginx)
│
▼
Kubernetes cluster (EKS / GKE)
│
├── Deployments:
│     ├── api (3 replicas) ─── Redis ──── Postgres (RDS)
│     ├── worker (2 replicas) ─┘
│     └── indexer (1 replica) ── chain RPC ── Postgres (RDS)
│
├── CronJobs:
│     ├── metrics exporter
│     └── backup pg_dump
│
└── Services:
├── Prometheus
└── Grafana

### CI/CD
GitHub Actions pipeline:
1. npm ci
2. npx hardhat compile
3. npx hardhat test (must pass)
4. docker build -f Dockerfile.prod (must succeed)

Mainnet deploy requires manual approval + multisig.

---

## 9. Limitations & Trade-offs Accepted

| Limitation | Reason |
|---|---|
| Single Postgres instance | Demo scope; production uses RDS Multi-AZ |
| No API authentication for public endpoints | Airdrops are inherently public; rate limit substitutes |
| No horizontal queue partitioning | Linear scaling via multiple workers is sufficient |
| IPFS not pinned via Pinata | Local kubo node suffices for demo; production uses Pinata/web3.storage |
| GaslessAirdrop stub | Real implementation requires Biconomy/Alchemy AA SDK |
| ZKAirdrop stub | Circom circuit + snarkjs toolchain out of scope |
| Graph Node pending | Postgres compatibility issues; custom indexer covers needs |

---

## 10. Roadmap (beyond Day 22)

1. *Day 23*: Harden GaslessAirdrop with real relayer signatures
2. *Day 24*: Circom circuit for ZKAirdrop (Poseidon Merkle tree)
3. *Day 25*: Resolve Graph Node setup (postgres:13 + v0.35.0)
4. *Day 26*: Polygon Amoy testnet deploy + Polygonscan verification
5. *Day 27*: Compound Governor integration (DAO upgrades)
6. *Day 28*: Mobile app (React Native + WalletConnect)
7. *Day 29*: Audit prep (Slither + Foundry invariant tests)
8. *Day 30*: CondoDAO MVP — apply all primitives to condo governance

---

## 11. References

- [EIP-712: Typed structured data hashing and signing](https://eips.ethereum.org/EIPS/eip-712)
- [ERC-1155: Multi Token Standard](https://eips.ethereum.org/EIPS/eip-1155)
- [ERC-4337: Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- [Merkle proofs in Solidity (OpenZeppelin)](https://docs.openzeppelin.com/contracts/5.x/api/utils#MerkleProof)
- [Sliding window rate limiting (Figma engineering)](https://www.figma.com/blog/an-alternative-approach-to-rate-limiting/)
- [The Graph documentation](https://thegraph.com/docs/)
- [CondoDAO — governance primitives for small communities (forthcoming)]

---

Document version: v1.0 · Last updated: 2026-09-04 · Author: csof2ware
