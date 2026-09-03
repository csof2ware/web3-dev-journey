
---

## PARTE II — DIA A DIA (execução, erros, lições)

Formato de cada dia: conceito, o que foi construído, commit, erro formativo (quando houve), e como explicar em entrevista.

### Dia 1 — Ambiente: Docker + WSL + Hardhat
Conceito: ambiente reproduzível vale mais que "funciona na minha máquina".
Construído: Dockerfile node:22-alpine, docker-compose com volume bind + volume anônimo em node_modules, hardhat compile/node.
Commit: Day 1: dockerized hardhat dev environment.
Erro formativo: dependências instaladas no host não existem no container -> node_modules vive em volume anônimo; arquivos criados dentro do container como root travam edição no WSL -> criar arquivos de projeto fora do container.
Entrevista: "Isolo toolchain em container; CI e dev rodam o mesmo binário."

### Dia 2 — ERC-1155 AirdropToken
Conceito: um contrato, infinitos tokens; batch transfers economizam gas.
Construído: AirdropToken (ERC1155 + Ownable), airdrop() onlyOwner com mint em lote.
Commit: Day 2: ERC-1155 airdrop token.
Entrevista: "1155 vs 721: batch ops e um deploy só; URI template com {id}."

### Dia 3 — Merkle proofs
Conceito: elegibilidade de N endereços por 32 bytes on-chain.
Construído: MerkleAirdrop com claim(proof); setupBackend gera 1000 carteiras + provas (merkletreejs, sortPairs).
Commit: Day 3: merkle allowlist airdrop.
Erro formativo: o verifier off-chain precisa espelhar EXATAMENTE o algoritmo on-chain (ordem de pares), senão 403 em massa.
Entrevista: "20M gas de lista on-chain vs 32 bytes de root: 400x mais barato."

### Dia 4 — Testes
Conceito: contrato sem teste é passivo, não ativo.
Construído: 17 testes (mint, auth, merkle, replay, metadata).
Commit: Day 4: full test suite.
Entrevista: "Gate de CI: nada mergeia sem suite verde."

### Dia 5 — Frontend inicial
Conceito: dApp = arquivos estáticos + RPC no browser.
Construído: página com ethers UMD, BrowserProvider, leitura de saldo.
Commit: Day 5: browser dApp.
Entrevista: "Wallet injeta provider; backend não guarda segredo do usuário."

### Dia 6 — IPFS básico
Conceito: endereçamento por conteúdo (CID), não por localização.
Construído: nó kubo no compose; upload via API 5001.
Commit: Day 6: kubo node in compose.
Entrevista: "CID = hash do conteúdo; imutabilidade de graça."

### Dia 7 — Backend high-throughput
Conceito: aceitar rápido, processar devagar; fila desacopla picos.
Construído: Express POST /claim -> verifica prova off-chain -> dedup (SISMEMBER) -> RPUSH claims -> worker BLPOP batch(50) -> 1 tx on-chain. Loadtest: 1000 claims ~3s, ~290-1000 req/s.
Commit: Day 7: redis queue + batching worker.
Erro formativo: reiniciou o hardhat node sem re-rodar setupBackend -> config.json aponta para contrato fantasma -> 403/0 eventos em tudo. Runbook de ordem de boot virou regra da casa.
Entrevista: "API responde em ms; chain confirma em blocos; fila é o amortecedor."

### Dia 8 — RPC failover + indexer de eventos
Conceito: nunca confie num RPC só; a chain é o banco, o resto é cache.
Construído: rpc.js (health-check paralelo, menor latência vence, withFailover sequencial); indexer com queryFilter passado + contract.on ao vivo.
Commit: Day 8: rpc failover + event indexer.
Entrevista: "Failover por latência e saúde; indexer idempotente retomando de MAX(block)."

### Dia 9 — PostgreSQL
Conceito: read model relacional para dados financeiros.
Construído: db.js (Pool, tabelas events/holders, UPSERT ON CONFLICT), endpoints /holders /stats.
Commit: Day 9: postgres read model + holders API.
Erro formativo: node-postgres retorna BIGINT como string (precisão) -> casts ::text explícitos e parse intencional.
Entrevista: "ACID para saldos; SQL para leaderboard; chain como origem."

### Dia 10 — IPFS metadata
Conceito: NFT sem metadata é hash sem história.
Construído: setMetadata.js: SVGs gerados em código + JSONs 0.json/1.json, wrap-with-directory, setURI ipfs://CID/{id}.json; teste de onlyOwner.
Commit: Day 10: ipfs metadata pipeline.
Erro formativo: {id} é convenção de CLIENTE (OpenSea), não lógica on-chain.
Entrevista: "Chain guarda ponteiro; conteúdo vive no IPFS; servidor central = imagem quebrada."

### Dia 11 — MetaMask
Conceito: o usuário assina; o backend só serve prova e config.
Construído: server serve frontend + GET /proof/:address + GET /config; EXTRA injeta a wallet dev na allowlist e financia 1 ETH; rede Hardhat Local 31337.
Commit: Day 11: metamask claim dapp.
Erros formativos: 127.0.0.1 no celular aponta para o celular (dApp é no PC); extensão injeta window.ethereum no load -> F5 resolve "não detectada".
Entrevista: "Prova no backend, assinatura na wallet, gas com o usuário."

### Dia 12 — CI/CD
Conceito: o gate de qualidade roda na nuvem, a cada push.
Construído: Dockerfile.prod multi-stage; ci.yml (npm ci, compile, test, docker build).
Commit: Day 12: prod dockerfile + github actions.
Erro formativo: HHE22 (npx baixa hardhat global) -> node_modules inconsistente após recreate -> npm install restaura.
Entrevista: "CI prova teste e build; CD seria job de deploy com secrets SSH."

### Dia 13 — Rate limit + monitoring
Conceito: proteger e observar são features, não afterthought.
Construído: sliding window com sorted sets (ZADD/ZREMRANGEBYSCORE/ZCARD, 5 req/10s); /health (redis+postgres+rpc, 503 quando doente); /metrics formato Prometheus sem dependências.
Commit: Day 13: sliding-window + health/metrics.
Erros formativos: chave EX naive permite rajada; sliding window impõe taxa real. 503 no health é o sinal que orquestrador usa para reiniciar container.
Entrevista: "Liveness probe + métricas = contrato com o orquestrador."

### Dia 14 — The Graph (pendência ativa)
Conceito: indexer declarativo da indústria, GraphQL tipado.
Construído: subgraph.yaml + schema.graphql + mapping AssemblyScript; graph-node no compose.
Status: PANIC deployment_schemas no setup do graph-node; tentativas: superuser (não era o problema), postgres dedicado 14 (mesmo erro). Plano: postgres:13 + graph-node v0.35.0. Pendência documentada, não esquecida.
Entrevista: "The Graph para dados públicos; indexer próprio para lógica de negócio; os dois coexistem."

### Dia 15 — EIP-712
Conceito: autorização off-chain grátis, liquidação on-chain paga.
Construído: SignedAirdrop (authority assina Claim(claimant,amount,nonce)); API GET /voucher com nonce via INCR; testes de replay e assinatura errada.
Commit: Day 15: eip-712 signed vouchers.
Entrevista: "Typed data legível na wallet; domain separator mata replay cross-chain; nonce mata replay local."

### Dia 16 — Account Abstraction (stub)
Conceito: alguém paga o gas; o usuário só assina.
Construído: GaslessAirdrop com relayer. AVISO: "sig" atual é keccak256(abi.encode(to)) — dado público, não assinatura. Stub arquitetural; endurecer com assinatura real do relayer (plano Dia 23).
Entrevista: "Separei o padrão (relayer patrocina) da criptografia (a implementar); sei exatamente o que está quebrado e por quê."

### Dia 17 — ZK proofs (stub)
Conceito: provar elegibilidade sem revelar o endereço.
Construído: ZKAirdrop com nullifier anti-double-claim; verifyProof simulado (return true). Plano: Circom + snarkjs + Groth16 + Poseidon (Dia 24).
Entrevista: "Nullifier = pseudônimo único por ação; o clássico do Semaphore/Tornado."

### Dia 18 — Auditoria
Conceito: achar o bug antes do deploy, não depois do exploit.
Construído: solhint + fuzz de 100 transfers aleatórios.
Erro formativo: slither é PYTHON (pip), não npm -> 404 no registry; documentado em AUDIT.md o stack completo de produção (slither, mythril, echidna, foundry).
Entrevista: "Estática + fuzz + invariantes; auditoria profissional antes de mainnet."

### Dia 19 — Testnet
Conceito: rede pública com chave descartável.
Construído: hardhat.config com Amoy + verify; regra de ouro: BURNER KEY nunca reutilizada, .env no gitignore (bots varrem commits em minutos).
Entrevista: "Testnet com chave dedicada = risco ~zero; mainnet com stub = dreno em minutos."

### Dia 20 — Observabilidade
Conceito: o que não é medido não é operado.
Construído: prometheus + grafana no compose; scrape de /metrics.
Entrevista: "Dashboards de throughput/erros/fila; alerta antes do usuário reclamar."

### Dia 21 — Docs profissionais
Construído: ARCHITECTURE.md com ADRs, threat model, topologia de produção, limitações declaradas.
Entrevista: "Documento que um tech lead leria e saberia o porquê de cada escolha."

### Dia 22 — Dashboard completo
Construído: frontend consome TUDO: carteira, claim Merkle, claim voucher, saldos nos dois contratos, stats, health com badges, top holders, metrics ao vivo (refresh 5s).
Entrevista: "Mesma API que o loadtest usa serve o dashboard: uma fonte, muitos consumidores."

---

## PARTE III — ERROS FORMATIVOS (consolidado)

1. Ordem de boot: node -> setupBackend -> server/worker/indexer. Config lido uma vez ao iniciar.
2. node_modules em volume anônimo; HHE22 após recreate -> npm install.
3. BIGINT como string no node-postgres.
4. {id} é convenção de cliente.
5. 127.0.0.1 é local a quem executa (celular != PC).
6. Sliding window vs chave EX.
7. slither = pip, não npm.
8. Burner key para testnet; bots caçam chaves em commits.
9. graph-node: panic deployment_schemas -> plano postgres:13 + v0.35.0.
10. Stubs declarados (16/17): saber o que está quebrado é competência, não vergonha.

---

## PARTE IV — COMO APRESENTAR

Pitch de 60 segundos:
"Construí uma plataforma de airdrop end-to-end: ERC-1155 com Merkle proofs, backend que enfileira 1000 claims em 3s e minera em batches de 50, indexer que reconstrói o banco a partir de eventos, API com sliding-window rate limit, healthchecks e métricas Prometheus, dApp com MetaMask e vouchers EIP-712, CI/CD no GitHub Actions e observabilidade com Grafana. Deixei dois stubs declarados (gasless e ZK) com plano de endurecimento — porque sei exatamente onde cada simplificação mora."

Perguntas e respostas prontas:
- "Por que não The Graph para tudo?" -> dados públicos vs lógica de negócio; coexistem.
- "1 milhão de claims?" -> workers horizontais na mesma fila, batch adaptativo, CDN de metadata.
- "Maior risco?" -> replay (nonce+domain), front-running (private mempool), access control; slither+fuzz antes do deploy.
- "Mainnet hoje?" -> não com stubs; testnet com burner key sim; mainnet após Dias 23-24 e auditoria.

---

## PARTE V — PRÓXIMOS PASSOS

23: GaslessAirdrop com assinatura real do relayer.
24: ZKAirdrop com Circom/snarkjs (Poseidon + Groth16).
25: The Graph resolvido (postgres:13 + v0.35.0).
26: Amoy deploy + Polygonscan verify.
27: Governor (DAO upgrades).
28: Mobile (WalletConnect).
29: Prep de auditoria (invariantes Foundry).
30: CondoDAO MVP — governança de condomínio com esta pilha.

---
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

---

# 📚 Glossário Web3 Completo

## Fundamentos
- *Blockchain*: livro-razão append-only replicado entre nós; histórico imutável de transações.
- *Bloco*: pacote de transações com hash do bloco anterior (daí "corrente").
- *Hash*: função determinística de sentido único (keccak256 no Ethereum).
- *Merkle Tree*: árvore de hashes; prova inclusão em O(log n) com 32 bytes por nível.
- *Merkle Root / Proof*: resumo da árvore / caminho de verificação de um item.
- *Nonce*: número usado uma vez (anti-replay em txs, provas ZK e vouchers).
- *Gas*: unidade de custo computacional; paga execução na EVM.
- *Wei / Gwei*: 10^-18 e 10^-9 ETH.
- *Consenso*: regra de acordo entre nós (PoW, PoS, PoA).
- *PoW*: prova de trabalho (Bitcoin) — segurança por energia.
- *PoS*: prova de participação (Ethereum) — segurança por capital travado.
- *PoA*: prova de autoridade — validadores identificados, chains privadas/testnet.
- *BFT*: tolerância a falhas bizantinas — consenso com nós maliciosos.
- *Finalidade (finality)*: ponto em que uma tx não pode mais ser revertida.
- *Imutabilidade*: histórico não editável; correção só por nova tx.
- *Trustless*: não depende de confiança em intermediário, só de criptografia/incentivos.
- *Permissionless*: qualquer um pode participar sem autorização.
- *Resistência a censura*: ninguém impede txs válidas.
- *Oráculo*: ponte de dados off-chain → on-chain (Chainlink).
- *Chain ID*: identificador de rede (1 mainnet, 31337 hardhat, 80002 amoy).
- *Mainnet / Testnet*: rede real com valor / rede de teste (Amoy, Sepolia).
- *Fork*: cópia/divergência de chain ou de código.

## Contas, Assinaturas e Transações
- *EOA*: conta de pessoa (par chave privada/pública).
- *Conta de contrato*: código executável com endereço próprio.
- *Chave privada / pública*: segredo que assina / deriva endereço.
- *Seed phrase*: 12/24 palavras que regeneram todas as chaves (BIP-39).
- *Mempool*: sala de espera de txs não mineradas.
- *ECDSA*: algoritmo de assinatura (secp256k1 no Ethereum).
- *EIP-712*: assinatura de dados tipados e legíveis (UX segura na wallet).
- *Replay protection*: domain separator + nonce impedem reuso de assinatura.
- *Account Abstraction (ERC-4337)*: contas viram contratos: gasless, batch, recovery.
- *Paymaster*: contrato que paga gas pelo usuário.
- *Bundler*: empacota UserOperations em txs (ERC-4337).
- *UserOperation*: "pseudo-transação" da account abstraction.
- *Multisig*: conta controlada por M-de-N chaves (Safe).
- *Social recovery*: recuperar conta via guardiões, sem seed.
- *EIP-1559*: base fee queimada + priority fee (gorjeta).
- *Fee burn*: queima de ETH (deflacionário em alta demanda).

## Tokens e Padrões
- *Fungível*: intercambiável (1 ETH = 1 ETH).
- *Não-fungível*: único e indivisível (NFT).
- *ERC-20*: token fungível padrão.
- *ERC-721*: NFT clássico.
- *ERC-1155*: multi-token (fungíveis + NFTs num contrato; batch = menos gas).
- *ERC-2612 (permit)*: approve por assinatura, sem tx de approve.
- *EIP-2981*: royalties de NFT padronizados.
- *Token URI / metadata*: ponteiro (geralmente IPFS) para nome/imagem/atributos.
- *Mint / Burn*: criar / destruir tokens.
- *Allowance + approve/transferFrom*: permissão de gasto de terceiros.
- *Soulbound token*: NFT intransferível (identidade/reputação).
- *Wrapped token*: representação 1:1 de outro ativo (wETH).

## DeFi
- *DEX*: exchange descentralizada (Uniswap).
- *AMM*: formador de mercado automático (x*y=k).
- *Liquidity Pool*: fundos depositados que habilitam swaps.
- *LP token*: recibo da posição de liquidez.
- *Slippage*: diferença entre preço esperado e executado.
- *Impermanent loss*: perda relativa de prover liquidez vs segurar ativos.
- *Staking*: travar tokens para segurança/recompensa.
- *Restaking*: reutilizar ETH stakeado como segurança de outros protocolos (EigenLayer).
- *Lending/borrowing*: empréstimo com colateral (Aave, Compound).
- *Liquidação*: venda do colateral quando saúde da dívida cai.
- *TVL*: valor total travado no protocolo.
- *Stablecoin*: token pareado a dólar (USDC, DAI).
- *Flash loan*: empréstimo sem colateral dentro de UMA tx.
- *Arbitragem*: lucro de diferença de preço entre mercados.
- *MEV*: valor extraível por ordenar/incluir txs.
- *Front-running*: copiar sua tx na frente pagando mais gas.
- *Sandwich*: comprar antes e vender depois da sua swap.
- *PBS / block builder*: separação proposer-builder (mitiga MEV).
- *Private mempool*: txs invisíveis até inclusão (Flashbots Protect).

## Escala (L2s e além)
- *L1*: chain base (Ethereum).
- *L2*: camada que herda segurança da L1 (rollups).
- *Optimistic rollup*: assume válido, janela de fraude (Optimism, Arbitrum).
- *ZK-rollup*: prova de validade matemática (zkSync, Starknet).
- *Fraud proof vs validity proof*: desafio pós-hoc vs prova imediata.
- *SNARK/STARK*: provas sucintas de conhecimento zero.
- *DA (data availability)*: garantia de que os dados das txs existem.
- *Sequencer*: ordenador de txs do L2.
- *Bridge*: ponte entre chains (risco nº 1 de hacks históricos).
- *Sidechain*: chain paralela com segurança própria (Polygon PoS).
- *TPS / block time*: throughput e cadência de blocos.
- *EVM*: máquina virtual do Ethereum; "EVM-compatible" roda bytecode Solidity.

## Segurança
- *Reentrancy*: chamar de volta antes de atualizar estado (DAO hack).
- *Checks-effects-interactions*: padrão anti-reentrância.
- *Oracle manipulation*: distorcer preço de oráculo (flash loans).
- *Access control*: onlyOwner/roles; causa nº 1 de exploits quando falha.
- *Proxy upgradable (UUPS/transparent)*: contrato com lógica trocável.
- *Timelock*: atraso entre aprovação e execução (janela de fuga).
- *Auditoria*: revisão profissional de código (Trail of Bits, OZ).
- *Fuzzing / invariant testing*: entradas aleatórias + propriedades que nunca quebram.
- *Static analysis*: slither, mythril — bugs sem rodar código.
- *Bug bounty*: recompensa por vulnerabilidades (Immunefi).
- *Rug pull*: time some com a liquidez.
- *Honeypot*: contrato que deixa comprar mas não vender.
- *Sybil attack*: um ator finge ser milhares.
- *51% attack*: maioria de hash/stake reescreve histórico.
- *Slashing*: punição com perda de stake por mau comportamento.

## Governança e DAOs
- *DAO*: organização governada por código + votação on-chain.
- *Governance token*: direito de voto (UNI, COMP).
- *Proposal / quórum / timelock*: ciclo de vida de decisão.
- *Delegação*: emprestar voto sem transferir tokens.
- *Snapshot*: votação off-chain assinada (gasless, peso on-chain).
- *Quadratic voting*: custo quadrático = voz mais distribuída.
- *Tesouraria on-chain*: fundos visíveis e controlados por voto.
- *Fork as exit*: discordou? Leve o código e a comunidade embora.
- *Proof-of-personhood*: 1 pessoa = 1 voto (Worldcoin, Gitcoin Passport).

## Infra e DevTools
- *RPC*: interface JSON-RPC com a chain (eth_call, eth_sendRawTransaction).
- *Provider / Signer*: leitura / escrita (ethers.js).
- *ABI*: "interface" do contrato para o mundo externo.
- *Bytecode / opcode*: código compilado / instruções da EVM.
- *Hardhat / Foundry*: frameworks dev+test (JS vs Solidity-native).
- *Anvil / Cast / Forge*: node local, CLI de chamadas, testes Foundry.
- *IPFS / CID*: storage content-addressed; mesmo conteúdo = mesmo CID.
- *Pinning / gateway*: manter dados disponíveis / servir via HTTP.
- *The Graph / subgraph*: indexer declarativo com GraphQL.
- *Archive node*: guarda todo o histórico de estado.
- *Rate limiting / sliding window*: controle de abuso por janela móvel.
- *Healthcheck (liveness/readiness)*: sinais para orquestradores.
- *Prometheus / Grafana*: coleta de métricas / dashboards.
- *CI/CD*: testes e builds automáticos a cada push.
- *Docker / compose*: isolamento e orquestração de ambientes.

## NFTs e Cultura
- *Collection / edition*: série única / múltiplas cópias numeradas.
- *Allowlist / whitelist*: elegibilidade prévia (nosso Merkle!).
- *Reveal*: metadata escondida até o mint fechar.
- *Generative art*: arte combinada algoritmicamente (Art Blocks).
- *PFP*: NFT de avatar/perfil.
- *POAP*: proof-of-attendance (presença como NFT).
- *Floor price*: menor preço de venda de uma coleção.
- *Metadata on-chain vs off-chain*: no contrato vs IPFS/HTTP (trade-off custo/resiliência).

## Tokenomics e Bens Públicos
- *Tokenomics*: emissão, distribuição, queima, incentivos.
- *Vesting / cliff*: liberação gradual de tokens (anti-dump).
- *Airdrop*: distribuição gratuita (growth + descentralização).
- *Quadratic funding*: matching que valoriza nº de apoiadores.
- *RWA*: ativos do mundo real tokenizados (imóveis, títulos).
- *Tragédia dos comuns*: recurso compartilhado sem coordenação colapsa — DAOs e tokens são a resposta programável.
