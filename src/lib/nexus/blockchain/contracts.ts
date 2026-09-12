import { ethers } from "ethers";

export const CONTRACT_ABI = [
  "constructor(uint256 _initialBudget, address _initialAgent)",
  "error OnlyOwner()",
  "error OnlyAuthorizedAgent()",
  "error BudgetExceeded(uint256 requestedAmount, uint256 remainingBudget)",
  "error DuplicateRequest(string requestId)",
  "error InvalidAmount()",
  "error InvalidAddress()",
  "error RequestNotFound(string requestId)",
  "event AgentAuthorized(address indexed previousAgent, address indexed newAgent)",
  "event BudgetUpdated(uint256 previousBudget, uint256 newBudget)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event PaymentSettled(string indexed requestId, address indexed agent, uint256 amount, uint256 totalSpent, bytes32 contentHash, string serviceId, string provider, uint256 timestamp)",
  "event PaymentBlocked(string indexed requestId, address indexed agent, uint256 amount, uint256 remainingBudget)",
  "function owner() view returns (address)",
  "function agent() view returns (address)",
  "function totalBudget() view returns (uint256)",
  "function totalSpent() view returns (uint256)",
  "function processedRequests(string) view returns (bool)",
  "function authorizeAgent(address _agent)",
  "function setBudget(uint256 _newBudget)",
  "function transferOwnership(address _newOwner)",
  "function settlePayment(string requestId, string serviceId, string provider, uint256 amount, bytes32 contentHash) returns (bool)",
  "function getRemainingBudget() view returns (uint256)",
  "function getBudgetSummary() view returns (uint256, uint256, uint256)",
  "function getPayment(string requestId) view returns (string _requestId, address _agent, uint256 _amount, string _serviceId, string _provider, bytes32 _contentHash, uint256 _timestamp)",
  "function isProcessed(string requestId) view returns (bool)",
  "function getPaymentCount() view returns (uint256)",
  "function getAllRequestIds() view returns (string[])",
];

export const CONTRACT_ADDRESS = "0x5fE21aB9c07D4e1b83Ac6F0d92B7431aEf08C6D1";
export const AGENT_ADDRESS = "0xB7C4F19a2d63e8A1f05Cb7d3e9A0c41F5d9c4d22";
export const OWNER_ADDRESS = "0xA34f81cB27eE09d4bA6C1e7f0A25b9d3E1c87F2B";
export const NETWORK = "Sepolia Testnet";
