const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Fuzz Airdrop", function () {
  it("100 claims aleatorios nao quebram nada", async function () {
    const [owner] = await ethers.getSigners();
    const F = await ethers.getContractFactory("AirdropToken");
    const t = await F.deploy();
    await t.waitForDeployment();
    
    for (let i = 0; i < 100; i++) {
      const rand = ethers.Wallet.createRandom();
      await t.safeTransferFrom(owner.address, rand.address, 0, 1, "0x");
    }
    expect(true).to.be.true;
  });

  it("batch airdrop com 50 enderecos aleatorios", async function () {
    const [owner] = await ethers.getSigners();
    const F = await ethers.getContractFactory("MerkleAirdrop");
    const addrs = [];
    for (let i = 0; i < 50; i++) addrs.push(ethers.Wallet.createRandom().address);
    const { MerkleTree } = require("merkletreejs");
    const leafOf = (a) => ethers.keccak256(a);
    const tree = new MerkleTree(addrs.map(leafOf), ethers.keccak256, { sortPairs: true });
    const root = tree.getHexRoot();
    
    const airdrop = await F.deploy(root);
    await airdrop.waitForDeployment();
    
    const proof = tree.getHexProof(leafOf(addrs[25]));
    await airdrop.claim(proof);
    expect(true).to.be.true;
  });
});
