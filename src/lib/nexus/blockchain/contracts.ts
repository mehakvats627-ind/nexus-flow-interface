export const CONTRACT_ABI = [
  "constructor(uint256 _initialBudget, address _initialAgent, address _usdcToken)",
  "error OnlyOwner()",
  "error OnlyAuthorizedAgent()",
  "error BudgetExceeded(uint256 requestedAmount, uint256 remainingBudget)",
  "error DuplicateRequest(string requestId)",
  "error InvalidAmount()",
  "error InvalidAddress()",
  "error RequestNotFound(string requestId)",
  "error TokenTransferFailed()",
  "event AgentAuthorized(address indexed previousAgent, address indexed newAgent)",
  "event BudgetUpdated(uint256 previousBudget, uint256 newBudget)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
  "event USDCTokenUpdated(address indexed previousToken, address indexed newToken)",
  "event PaymentSettled(string indexed requestId, address indexed agent, uint256 amount, uint256 totalSpent, bytes32 contentHash, string serviceId, string provider, uint256 timestamp)",
  "event PaymentBlocked(string indexed requestId, address indexed agent, uint256 amount, uint256 remainingBudget)",
  "function owner() view returns (address)",
  "function agent() view returns (address)",
  "function usdcToken() view returns (address)",
  "function totalBudget() view returns (uint256)",
  "function totalSpent() view returns (uint256)",
  "function processedRequests(string) view returns (bool)",
  "function setUSDCToken(address _newToken)",
  "function authorizeAgent(address _agent)",
  "function setBudget(uint256 _newBudget)",
  "function transferOwnership(address _newOwner)",
  "function settlePayment(string requestId, string serviceId, string provider, uint256 amount, bytes32 contentHash) returns (bool)",
  "function settlePaymentWithRecipient(string requestId, string serviceId, string provider, address recipient, uint256 amount, bytes32 contentHash) returns (bool)",
  "function getRemainingBudget() view returns (uint256)",
  "function getBudgetSummary() view returns (uint256, uint256, uint256)",
  "function getPayment(string requestId) view returns (string _requestId, address _agent, uint256 _amount, string _serviceId, string _provider, bytes32 _contentHash, uint256 _timestamp)",
  "function getPaymentRecord(string requestId) view returns (tuple(string requestId, address agent, uint256 amount, string serviceId, string provider, address recipient, bytes32 contentHash, uint256 timestamp))",
  "function isProcessed(string requestId) view returns (bool)",
  "function getPaymentCount() view returns (uint256)",
  "function getAllRequestIds() view returns (string[])",
];

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

const env =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env
    : ({} as Record<string, string | undefined>);

export const CONTRACT_ADDRESS =
  env.VITE_CONTRACT_ADDRESS || env.CONTRACT_ADDRESS || "0x5fE21aB9c07D4e1b83Ac6F0d92B7431aEf08C6D1";

export const USDC_ADDRESS =
  env.VITE_USDC_ADDRESS || env.USDC_ADDRESS || "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export const AGENT_ADDRESS =
  env.VITE_AGENT_ADDRESS || env.AGENT_ADDRESS || "0xB7C4F19a2d63e8A1f05Cb7d3e9A0c41F5d9c4d22";

export const OWNER_ADDRESS =
  env.VITE_OWNER_ADDRESS || env.OWNER_ADDRESS || "0xA34f81cB27eE09d4bA6C1e7f0A25b9d3E1c87F2B";

export const SEPOLIA_RPC_URL =
  env.VITE_SEPOLIA_RPC_URL || env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

export const PRIVATE_KEY = env.VITE_PRIVATE_KEY || env.PRIVATE_KEY || "";

export const NETWORK = env.VITE_NETWORK || env.NETWORK || "Sepolia Testnet";

export const CHAIN_ID = 11155111;

export const EXPLORER_BASE_URL = "https://sepolia.etherscan.io";

export const getExplorerTxUrl = (txHash: string) => `${EXPLORER_BASE_URL}/tx/${txHash}`;
export const getExplorerAddressUrl = (address: string) => `${EXPLORER_BASE_URL}/address/${address}`;
