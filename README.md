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
