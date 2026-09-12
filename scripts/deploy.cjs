const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();

async function deploy() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
  const privateKey = process.env.PRIVATE_KEY;
  const initialBudget = process.env.INITIAL_BUDGET || 10;
  const agentAddress = process.env.AGENT_ADDRESS || "0xB7C4F19a2d63e8A1f05Cb7d3e9A0c41F5d9c4d22";

  console.log("--------------------------------------------------");
  console.log("Deploying NexusBudgetManager Contract...");
  console.log("RPC URL:", rpcUrl);
  console.log("Initial Budget:", initialBudget, "USDC");
  console.log("Agent Address:", agentAddress);

  if (!privateKey || privateKey.startsWith("0x0000000000000000000000000000000000000000000000000000000000000001")) {
    console.warn("\n[NOTE] No real PRIVATE_KEY specified in environment. Generated simulation wallet for demonstration.\n");
  }

  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/NexusBudgetManager.sol/NexusBudgetManager.json");
  let artifact;
  if (fs.existsSync(artifactPath)) {
    artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  } else {
    artifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../contracts/artifacts/NexusBudgetManager.json"), "utf8"));
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = privateKey ? new ethers.Wallet(privateKey, provider) : ethers.Wallet.createRandom().connect(provider);

  console.log("Deployer Address:", wallet.address);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode.object || artifact.bytecode, wallet);
  
  try {
    const contract = await factory.deploy(initialBudget, agentAddress);
    console.log("Transaction Hash:", contract.deploymentTransaction()?.hash);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log("\n Contract successfully deployed to:", address);
    console.log("--------------------------------------------------");
    return address;
  } catch (error) {
    console.error("Deployment failed or offline:", error.message);
  }
}

if (require.main === module) {
  deploy();
}

module.exports = { deploy };
