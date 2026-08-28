const { ethers } = require("ethers");
const fs = require("fs");

const cfg = JSON.parse(fs.readFileSync("backend/config.json"));
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const abi = [
  "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
];
const token = new ethers.Contract(cfg.address, abi, provider);

const DB_FILE = "backend/holders.json";
let db = {};
if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE));

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

async function indexPast() {
  const latest = await provider.getBlockNumber();
  const events = await token.queryFilter("TransferSingle", 0, latest);
  for (const ev of events) {
    const to = ev.args.to;
    db[to] = (db[to] || 0) + Number(ev.args.value);
  }
  save();
  console.log("Eventos passados: " + events.length + " | holders: " + Object.keys(db).length);
}

async function live() {
  token.on("TransferSingle", function (operator, from, to, id, value) {
    db[to] = (db[to] || 0) + Number(value);
    save();
    console.log("+ holder " + to.slice(0, 10) + "... | total: " + Object.keys(db).length);
  });
  console.log("Indexer AO VIVO escutando TransferSingle...");
}

indexPast().then(live);
