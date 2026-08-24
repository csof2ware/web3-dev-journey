const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");

const leafOf = (addr) => ethers.keccak256(addr);
const hashFn = (data) => ethers.keccak256(data);

describe("GaslessAirdrop", function () {
  let airdrop, owner, alice, bob, relayer;
  let tree, aliceProof;
  const FAKE_FORWARDER = "0x0000000000000000000000000000000000000001";

  beforeEach(async function () {
    [owner, alice, bob, relayer] = await ethers.getSigners();

    tree = new MerkleTree([alice.address, bob.address].map(leafOf), hashFn, { sortPairs: true });
    aliceProof = tree.getHexProof(leafOf(alice.address));

    const GaslessAirdrop = await ethers.getContractFactory("GaslessAirdrop");
    airdrop = await GaslessAirdrop.deploy(tree.getHexRoot(), FAKE_FORWARDER);
    await airdrop.waitForDeployment();
  });

  it("Deve permitir claim direto (sem relayer)", async function () {
    await airdrop.connect(alice).claim(aliceProof);
    expect(await airdrop.balanceOf(alice.address, 0)).to.equal(1);
  });

  it("Deve bloquear duplo claim", async function () {
    await airdrop.connect(alice).claim(aliceProof);
    await expect(airdrop.connect(alice).claim(aliceProof))
      .to.be.revertedWith("Already claimed");
  });

  it("Deve usar _msgSender() corretamente", async function () {
    // Claim direto: msg.sender = alice
    await airdrop.connect(alice).claim(aliceProof);
    expect(await airdrop.hasClaimed(alice.address)).to.be.true;
  });
});
