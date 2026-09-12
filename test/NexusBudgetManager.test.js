import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load compiled artifact
const artifactPath = path.resolve(__dirname, "../artifacts/contracts/NexusBudgetManager.sol/NexusBudgetManager.json");
let artifact;
if (fs.existsSync(artifactPath)) {
  artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
} else {
  // Fallback to solc artifact
  artifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../contracts/artifacts/NexusBudgetManager.json"), "utf8"));
}

const abi = artifact.abi;
const bytecode = artifact.bytecode?.object || artifact.bytecode;

async function runTests() {
  console.log("\n========================================================");
  console.log("  NEXUS SMART CONTRACT TEST SUITE (NexusBudgetManager)");
  console.log("========================================================\n");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  async function test(name, fn) {
    totalTests++;
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ✘ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failedTests++;
    }
  }

  // Set up local simulated or in-memory EVM provider & signers
  // We can use a local Ganache/Hardhat JSON-RPC or Ethers provider
  let provider;
  let ownerSigner;
  let agentSigner;
  let unauthorizedSigner;

  // Let's connect to local hardhat node or fallback to standard HD wallet provider
  try {
    provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    await provider.getBlockNumber();
    const accounts = await provider.listAccounts();
    ownerSigner = accounts[0];
    agentSigner = accounts[1] || (await provider.getSigner(1));
    unauthorizedSigner = accounts[2] || (await provider.getSigner(2));
  } catch {
    // If external node is not running, we spin up local in-process hardhat node or simulate with ethers wallets
    // For pure unit testing with contract factory, let's connect to Hardhat node or simulated local EVM
  }

  return { totalTests, passedTests, failedTests };
}

export { runTests };
