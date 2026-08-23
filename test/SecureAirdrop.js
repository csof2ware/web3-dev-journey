const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");

const leafOf = (addr) => ethers.keccak256(addr);
const hashFn = (data) => ethers.keccak256(data);

describe("SecureAirdrop", function () {
  let airdrop, gate, owner, alice, bob, stranger;
  let tree, aliceProof, deadline, domain, types;

  const signClaim = (account, nonce, dl) =>
    owner.signTypedData(domain, types, { account: account.address, nonce, deadline: dl });

  beforeEach(async function () {
    [owner, alice, bob, stranger] = await ethers.getSigners();

    // Gate token: só Alice e Bob possuem
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    gate = await MockERC20.deploy();
    await gate.waitForDeployment();
    await gate.mint(alice.address, 100);
    await gate.mint(bob.address, 100);

    // Merkle: os 3 na lista (stranger testa o bloqueio econômico)
    tree = new MerkleTree(
      [alice.address, bob.address, stranger.address].map(leafOf),
      hashFn,
      { sortPairs: true }
    );
    aliceProof = tree.getHexProof(leafOf(alice.address));

    const SecureAirdrop = await ethers.getContractFactory("SecureAirdrop");
    airdrop = await SecureAirdrop.deploy(
      tree.getHexRoot(),
      await gate.getAddress(),
      1,
      owner.address
    );
    await airdrop.waitForDeployment();

    const net = await ethers.provider.getNetwork();
    domain = {
      name: "SecureAirdrop",
      version: "1",
      chainId: net.chainId,
      verifyingContract: await airdrop.getAddress(),
    };
    types = {
      Claim: [
        { name: "account", type: "address" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const block = await ethers.provider.getBlock("latest");
    deadline = block.timestamp + 3600;
  });

  it("Deve permitir claim com prova + assinatura + token", async function () {
    const sig = await signClaim(alice, 0, deadline);
    await airdrop.connect(alice).claim(aliceProof, deadline, sig);
    expect(await airdrop.balanceOf(alice.address, 0)).to.equal(1);
  });

  it("Deve bloquear duplo claim", async function () {
    const sig = await signClaim(alice, 0, deadline);
    await airdrop.connect(alice).claim(aliceProof, deadline, sig);
    await expect(airdrop.connect(alice).claim(aliceProof, deadline, sig))
      .to.be.revertedWith("Already claimed");
  });

  it("Deve bloquear assinatura com nonce errado", async function () {
    const wrongNonceSig = await signClaim(alice, 1, deadline); // contrato espera nonce 0
    await expect(airdrop.connect(alice).claim(aliceProof, deadline, wrongNonceSig))
      .to.be.revertedWith("Bad signature");
  });

  it("Deve bloquear quem nao tem o gate token (sybil economico)", async function () {
    const strangerProof = tree.getHexProof(leafOf(stranger.address));
    const sig = await signClaim(stranger, 0, deadline);
    await expect(airdrop.connect(stranger).claim(strangerProof, deadline, sig))
      .to.be.revertedWith("Not eligible holder");
  });

  it("Deve bloquear assinatura expirada", async function () {
    const past = (await ethers.provider.getBlock("latest")).timestamp - 10;
    const sig = await signClaim(alice, 0, past);
    await expect(airdrop.connect(alice).claim(aliceProof, past, sig))
      .to.be.revertedWith("Expired");
  });

  it("Deve bloquear assinatura de signer errado", async function () {
    const badSig = await stranger.signTypedData(domain, types, {
      account: alice.address, nonce: 0, deadline,
    });
    await expect(airdrop.connect(alice).claim(aliceProof, deadline, badSig))
      .to.be.revertedWith("Bad signature");
  });
});
