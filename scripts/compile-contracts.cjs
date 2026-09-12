const fs = require("fs");
const path = require("path");
const solc = require("solc");

function compile() {
  const contractPath = path.resolve(__dirname, "../contracts/NexusBudgetManager.sol");
  const testContractPath = path.resolve(__dirname, "../contracts/test/NexusBudgetManager.t.sol");

  const source = fs.readFileSync(contractPath, "utf8");
  const testSource = fs.readFileSync(testContractPath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "NexusBudgetManager.sol": {
        content: source,
      },
      "test/NexusBudgetManager.t.sol": {
        content: testSource,
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

  console.log("Compiling Solidity contracts with solc...");
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

  const artifactDir = path.resolve(__dirname, "../contracts/artifacts");
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  for (const [sourceFile, contracts] of Object.entries(output.contracts)) {
    for (const [contractName, contractData] of Object.entries(contracts)) {
      const artifact = {
        contractName,
        sourceName: sourceFile,
        abi: contractData.abi,
        bytecode: contractData.evm.bytecode.object,
        deployedBytecode: contractData.evm.deployedBytecode.object,
        compiledAt: new Date().toISOString(),
      };

      fs.writeFileSync(
        path.join(artifactDir, `${contractName}.json`),
        JSON.stringify(artifact, null, 2),
        "utf8",
      );
    }
  }

  console.log("Compilation successful! Artifacts saved to contracts/artifacts.");
}

if (require.main === module) {
  compile();
}

module.exports = { compile };
