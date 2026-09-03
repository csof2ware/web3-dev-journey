const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("GaslessAirdrop", function () {
  it("relayer paga gas pelo usuario", async function () {
    const [owner, relayer, user] = await ethers.getSigners();
    const F = await ethers.getContractFactory("GaslessAirdrop");
    const c = await F.deploy(relayer.address);
    await c.waitForDeployment();
    const sig = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [user.address]));
    await c.connect(relayer).claim(user.address, sig);
    expect(await c.balanceOf(user.address, 0)).to.equal(1);
  });
});
