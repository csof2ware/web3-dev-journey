const express = require("express");
const Redis = require("ioredis");
const { ethers } = require("ethers");
const fs = require("fs");

const cfg = JSON.parse(fs.readFileSync("backend/config.json"));
const redis = new Redis("redis://redis:6379");
const app = express();
app.use(express.json());

function leafOf(a) { return ethers.keccak256(a); }

// Réplica EXATA do MerkleProof.verify do OpenZeppelin (sortPairs)
function verifyProof(proof, leaf, root) {
  let computed = leaf;
  for (let i = 0; i < proof.length; i++) {
    const p = proof[i];
    if (BigInt(computed) <= BigInt(p)) {
      computed = ethers.keccak256(ethers.concat([computed, p]));
    } else {
      computed = ethers.keccak256(ethers.concat([p, computed]));
    }
  }
  return computed === root;
}

app.post("/claim", async function (req, res) {
  const address = req.body.address;
  const proof = req.body.proof;

  if (await redis.exists("rl:" + address)) {
    return res.status(429).json({ error: "rate limited" });
  }

  if (await redis.sismember("claimed", address)) {
    return res.status(409).json({ error: "already claimed" });
  }

  const ok = verifyProof(proof, leafOf(address), cfg.root);
  if (!ok) {
    return res.status(403).json({ error: "not eligible" });
  }

  await redis.rpush("claims", address);
  await redis.sadd("claimed", address);
  await redis.set("rl:" + address, 1, "EX", 10);

  res.json({ status: "queued" });
});

app.get("/queue", async function (req, res) {
  const len = await redis.llen("claims");
  res.json({ queueLength: len });
});

app.listen(3000, function () {
  console.log("API no ar na porta 3000");
});
