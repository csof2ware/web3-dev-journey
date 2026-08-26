const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const fs = require("fs");

const leafOf = (a) => ethers.keccak256(a);
const hashFn = (d) => ethers.keccak256(d);

async function main() {
  // Simula o banco: 1000 carteiras elegíveis
  const wallets = [];
  for (let i = 0; i < 1000; i++) wallets.push(ethers.Wallet.createRandom().address);

  const tree = new MerkleTree(wallets.map(leafOf), hashFn, { sortPairs: true });

  const AirdropToken = await ethers.getContractFactory("AirdropToken");
  const token = await AirdropToken.deploy();
  await token.waitForDeployment();

  fs.writeFileSync("backend/config.json", JSON.stringify({
    address: await token.getAddress(),
    root: tree.getHexRoot(),
    wallets,
    proofs: wallets.map((w) => tree.getHexProof(leafOf(w))),
  }, null, 2));

  console.log("✅ backend/config.json gerado (1000 elegíveis + provas)");
}
main().catch((e) => { console.error(e); process.exit(1); });
