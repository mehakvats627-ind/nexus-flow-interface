const fs = require("fs");
const path = require("path");
const solc = require("solc");

function compile() {
  const contractPath = path.resolve(__dirname, "../contracts/NexusBudgetManager.sol");
  const source = fs.readFileSync(contractPath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "NexusBudgetManager.sol": {
        content: source,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode", "evm.deployedBytecode"],
        },
      },
    },
  };

  console.log("Compiling NexusBudgetManager.sol with solc...");
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      if (error.severity === "error") {
        console.error("Solidity Error:", error.formattedMessage);
        hasError = true;
      } else {
        console.warn("Solidity Warning:", error.formattedMessage);
      }
    }
    if (hasError) {
      process.exit(1);
    }
  }

  const contract = output.contracts["NexusBudgetManager.sol"]["NexusBudgetManager"];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  const artifactDir = path.resolve(__dirname, "../contracts/artifacts");
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const artifact = {
    contractName: "NexusBudgetManager",
    abi,
    bytecode,
    deployedBytecode: contract.evm.deployedBytecode.object,
    compiledAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(artifactDir, "NexusBudgetManager.json"),
    JSON.stringify(artifact, null, 2),
    "utf8"
  );

  console.log("Compilation successful! Artifact saved to contracts/artifacts/NexusBudgetManager.json");
  return artifact;
}

if (require.main === module) {
  compile();
}

module.exports = { compile };
