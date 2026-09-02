const express = require("express");
const Redis = require("ioredis");
const { ethers } = require("ethers");
const fs = require("fs");
const db = require("./db");

const cfg = JSON.parse(fs.readFileSync("backend/config.json"));
const redis = new Redis("redis://redis:6379");
const app = express();
app.use(express.json());
app.use(express.static("frontend"));

function leafOf(a) { return ethers.keccak256(a); }

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

app.get("/config", function (req, res) {
  res.json({ airdropAddress: cfg.airdropAddress, root: cfg.root });
});

app.get("/proof/:address", function (req, res) {
  const addr = req.params.address.toLowerCase();
  const idx = cfg.wallets.findIndex(function (w) { return w.toLowerCase() === addr; });
  if (idx === -1) return res.status(404).json({ error: "nao elegivel" });
  res.json({ proof: cfg.proofs[idx] });
});

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

app.get("/holders", async function (req, res) {
  try {
    res.json(await db.getHolders(100));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "banco indisponivel" });
  }
});

app.get("/holders/:address", async function (req, res) {
  const h = await db.getHolder(req.params.address);
  if (!h) return res.status(404).json({ error: "holder nao encontrado" });
  res.json(h);
});

app.get("/stats", async function (req, res) {
  res.json(await db.getStats());
});

app.listen(3000, function () {
  console.log("API + frontend no ar: http://localhost:3000");
});
