⛓️ Zero to Web3 Engineer
Public build journal: from my first smart contract to production-grade
blockchain systems, following the requirements of real senior job
descriptions (High-Throughput Airdrop Platform & AI Model Marketplace).
🎯 Mission
Learn in public and build a portfolio that proves I can ship:
ERC-20 / 721 / 1155 token systems, royalties (ERC-2981), upgradeable contracts
Merkle-proof airdrops, sybil/replay protection, relayers (gasless UX)
SIWE auth, wallet integrations (MetaMask, WalletConnect)
High-throughput infra: Redis, PostgreSQL, RPC failover, event indexers
IPFS storage, sec-/-urity tooling (Slither), gas optimization
🛠️ Stack
Solidity · Hardhat · OpenZeppelin · ethers.js v6 · Node 22 · Docker · WSL2
▶️ Quick start
bash
1
2
3
4
docker compose up -d --build
docker compose exec dev sh
npx hardhat test
npx hardhat run scripts/deploy.js
🗺️ Roadmap
☑️
Day 1 – Env (WSL2+Docker), ERC-721, tests, local deploy
☐
Day 2 – ERC-1155 + batch minting (gas-efficient airdrops)
☐
Day 3 – Merkle proofs (allowlisted claims)
☐
Day 4 – Sybil & replay protection
☐
Day 5 – Multi-chain deploy (ETH, Polygon, Base)
☐
Week 2 – Backend: Redis, queues, RPC failover, indexer, IPFS
☐
Week 3 – Frontend: SIWE + JWT, MetaMask/WalletConnect, fast UX
☐
Week 4 – PRO: UUPS upgradeables, staking, Slither, Solana/Anchor
📁 Structure
1
2
3
4
5
6
7
8
9
10
11
12
13
14
contracts/   Solidity contracts
test/        Mocha/Chai tests
scripts/     Deploy & task scripts
```

## 📔 Daily Log
### Day 1 — First NFT on-chain
- Reproducible dev env: WSL2 + Docker (node:22-alpine)
- ERC-721 with Ownable access control
- Tests: mint OK + attacker blocked (onlyOwner)
- Learned: msg.sender, _safeMint vs _mint, BigInt (ethers v6),
  EVM Cancun/mcopy, Docker volumes & build caches

### Day 2 — ERC-1155 batch minting
- Single contract managing multiple token types (EARLY_ADOPTER=0, VIP=1)
- mintBatch: multiple token IDs to one wallet in 1 tx
- airdrop(): same token to many wallets in 1 tx (gas-efficient)
- Learned: balanceOf(account, id) vs ERC-721 balanceOf(account),
  _mintBatch vs loop _mint, and why batch = ~90% less gas

### Day 3 — Merkle proofs
- Off-chain tree (merkletreejs), on-chain only the 32-byte root
- claim(proof) with OZ MerkleProof; hasClaimed blocks double claims
- Learned: leaf = keccak256(abi.encodePacked(addr)), sortPairs:true,
  ethers v6 hash-fn signature pitfall (TypeError .length)
  
### Day 4 — Sybil & replay protection
* Defense in depth: Merkle + hasClaimed + no-contract check + ERC-20 gate
* EIP-712 signed claims: per-user nonce + deadline + chainId domain separator
* Learned: Sybil = fake identities; replay = reused proofs/signatures;
  domain separator kills cross-chain replay

### Day 5 — Multi-chain deployment
- hardhat.config with sepolia / amoy / baseSepolia (chainId + RPC + accounts)
- Secrets via dotenv (.env gitignored) — never commit keys
- First real testnet deploy with explorer links
- Learned: same bytecode on many chains; chainId kills cross-chain replay;
  public RPCs are rate-limited → failover needed (Week 2)

## 🌐 Deployed Contracts
- *Polygon Amoy:* [0x8787f93A5CfdAF3e03570619b20A73Ad6A571194](https://amoy.polygonscan.com/address/0x8787f93A5CfdAF3e03570619b20A73Ad6A571194)

### Day 6 — Relayers & gasless claims
- ERC2771Context: contract accepts meta-transactions from trusted forwarder
- _msgSender() returns the REAL user (not the relayer)
- User signs off-chain, relayer pays gas → zero-friction UX
- Learned: Biconomy/Account Abstraction (ERC-4337) vs traditional meta-tx (ERC-2771)



### Day 8 — RPC failover + event indexer
- Failover: health-checks the RPC list in parallel, picks lowest latency, auto-switches on failure
- Indexer: queryFilter(TransferSingle) for history + contract.on() for live updates
- holders.json rebuilt purely from chain events
- Learned: never trust a single RPC; the chain is the database, everything else is a cache

### Day 9 — PostgreSQL + holders API
- Postgres in compose; events + holders tables with UPSERT (ON CONFLICT)
- Indexer resumes from last indexed block (incremental, not full re-scan)
- API endpoints: /holders, /holders/:address, /stats (pure SQL behind REST)
- Learned: BIGINT comes as string in node-postgres; chain = source of truth, DB = read model

### Day 10 — IPFS + NFT metadata
- Own kubo (IPFS) node in docker-compose (API 5001, gateway 8080)
- Upload via /api/v0/add with FormData/Blob; wrap-with-directory for {id}.json template
- SVG badges generated in code and pinned; setURI onlyOwner writes the template on-chain
- Learned: chain stores only the pointer (ipfs://CID/{id}.json); content lives in IPFS;
  {id} substitution is a client convention (OpenSea), not on-chain logic

### Day 11 — Claim frontend with MetaMask
- Express serves the dApp (express.static) + GET /proof/:address + GET /config
- BrowserProvider + MetaMask on Hardhat Local (31337); user signs claim(proof) directly
- EXTRA env injects the dev wallet into the Merkle allowlist + funds it with 1 ETH
- Learned: dApp = static files + RPC in the browser; backend only serves proofs/config
