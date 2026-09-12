// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface for standard ERC20 token operations used in USDC settlement.
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/**
 * @title NexusBudgetManager
 * @dev Enforces hard spending caps, agent authorization, duplicate protection (idempotency),
 *      cryptographic delivery proofs, and real ERC20 USDC settlement for autonomous AI agent payments.
 */
contract NexusBudgetManager {
    // --- Custom Errors ---
    error OnlyOwner();
    error OnlyAuthorizedAgent();
    error BudgetExceeded(uint256 requestedAmount, uint256 remainingBudget);
    error DuplicateRequest(string requestId);
    error InvalidAmount();
    error InvalidAddress();
    error RequestNotFound(string requestId);
    error TokenTransferFailed();

    // --- State Variables ---
    address public owner;
    address public agent;
    uint256 public totalBudget;
    uint256 public totalSpent;
    IERC20 public usdcToken;

    struct PaymentRecord {
        string requestId;
        address agent;
        uint256 amount;
        string serviceId;
        string provider;
        address recipient;
        bytes32 contentHash;
        uint256 timestamp;
    }

    // Mapping from requestId to payment record
    mapping(string => PaymentRecord) private payments;
    // Mapping from requestId to whether it has been processed
    mapping(string => bool) public processedRequests;
    // Array of requestIds in order of settlement for auditability
    string[] public requestIds;

    // --- Events ---
    event AgentAuthorized(address indexed previousAgent, address indexed newAgent);
    event BudgetUpdated(uint256 previousBudget, uint256 newBudget);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event USDCTokenUpdated(address indexed previousToken, address indexed newToken);
    event PaymentSettled(
        string indexed requestId,
        address indexed agent,
        uint256 amount,
        uint256 totalSpent,
        bytes32 contentHash,
        string serviceId,
        string provider,
        uint256 timestamp
    );
    event PaymentBlocked(string indexed requestId, address indexed agent, uint256 amount, uint256 remainingBudget);

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyAgentOrOwner() {
        if (msg.sender != agent && msg.sender != owner) revert OnlyAuthorizedAgent();
        _;
    }

    /**
     * @dev Constructor sets the owner, initial budget, authorized agent, and USDC token address.
     */
    constructor(uint256 _initialBudget, address _initialAgent, address _usdcToken) {
        owner = msg.sender;
        totalBudget = _initialBudget;
        if (_initialAgent != address(0)) {
            agent = _initialAgent;
            emit AgentAuthorized(address(0), _initialAgent);
        }
        if (_usdcToken != address(0)) {
            usdcToken = IERC20(_usdcToken);
            emit USDCTokenUpdated(address(0), _usdcToken);
        }
        if (_initialBudget > 0) {
            emit BudgetUpdated(0, _initialBudget);
        }
    }

    /**
     * @dev Owner configures or updates the USDC token contract address.
     */
    function setUSDCToken(address _newToken) external onlyOwner {
        address oldToken = address(usdcToken);
        usdcToken = IERC20(_newToken);
        emit USDCTokenUpdated(oldToken, _newToken);
    }

    /**
     * @dev Owner authorizes a new AI agent address.
     */
    function authorizeAgent(address _agent) external onlyOwner {
        if (_agent == address(0)) revert InvalidAddress();
        address oldAgent = agent;
        agent = _agent;
        emit AgentAuthorized(oldAgent, _agent);
    }

    /**
     * @dev Owner updates the total budget cap.
     */
    function setBudget(uint256 _newBudget) external onlyOwner {
        uint256 oldBudget = totalBudget;
        totalBudget = _newBudget;
        emit BudgetUpdated(oldBudget, _newBudget);
    }

    /**
     * @dev Owner transfers contract ownership.
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert InvalidAddress();
        address oldOwner = owner;
        owner = _newOwner;
        emit OwnershipTransferred(oldOwner, _newOwner);
    }

    /**
     * @dev Settles payment with a designated recipient payee address.
     *      Enforces duplicate prevention, hard budget cap, real ERC20 transferFrom, and stores content hash.
     */
    function settlePaymentWithRecipient(
        string calldata requestId,
        string calldata serviceId,
        string calldata provider,
        address recipient,
        uint256 amount,
        bytes32 contentHash
    ) public onlyAgentOrOwner returns (bool) {
        if (amount == 0) revert InvalidAmount();
        if (bytes(requestId).length == 0) revert InvalidAmount();

        // 1. Idempotency / Duplicate Check
        if (processedRequests[requestId]) {
            revert DuplicateRequest(requestId);
        }

        // 2. Budget Cap Enforcement
        uint256 remaining = getRemainingBudget();
        if (amount > remaining) {
            emit PaymentBlocked(requestId, msg.sender, amount, remaining);
            revert BudgetExceeded(amount, remaining);
        }

        address payTo = recipient == address(0) ? owner : recipient;

        // 3. Real USDC ERC20 Settlement via transferFrom
        if (address(usdcToken) != address(0)) {
            bool success = usdcToken.transferFrom(msg.sender, payTo, amount);
            if (!success) revert TokenTransferFailed();
        }

        // 4. Update state
        totalSpent += amount;
        processedRequests[requestId] = true;

        payments[requestId] = PaymentRecord({
            requestId: requestId,
            agent: msg.sender,
            amount: amount,
            serviceId: serviceId,
            provider: provider,
            recipient: payTo,
            contentHash: contentHash,
            timestamp: block.timestamp
        });
        requestIds.push(requestId);

        emit PaymentSettled(
            requestId,
            msg.sender,
            amount,
            totalSpent,
            contentHash,
            serviceId,
            provider,
            block.timestamp
        );

        return true;
    }

    /**
     * @dev Overloaded settlePayment matching the standard 5-parameter interface.
     *      Defaults the recipient to the contract owner / provider treasury.
     */
    function settlePayment(
        string calldata requestId,
        string calldata serviceId,
        string calldata provider,
        uint256 amount,
        bytes32 contentHash
    ) external onlyAgentOrOwner returns (bool) {
        return settlePaymentWithRecipient(requestId, serviceId, provider, owner, amount, contentHash);
    }

    // --- View Functions ---

    /**
     * @notice Get remaining budget.
     */
    function getRemainingBudget() public view returns (uint256) {
        if (totalSpent >= totalBudget) {
            return 0;
        }
        return totalBudget - totalSpent;
    }

    /**
     * @notice Get budget summary: (totalBudget, totalSpent, remainingBudget).
     */
    function getBudgetSummary() external view returns (uint256, uint256, uint256) {
        return (totalBudget, totalSpent, getRemainingBudget());
    }

    /**
     * @notice Fetch payment record for a given requestId.
     */
    function getPayment(string calldata requestId)
        external
        view
        returns (
            string memory _requestId,
            address _agent,
            uint256 _amount,
            string memory _serviceId,
            string memory _provider,
            bytes32 _contentHash,
            uint256 _timestamp
        )
    {
        if (!processedRequests[requestId]) {
            revert RequestNotFound(requestId);
        }
        PaymentRecord storage r = payments[requestId];
        return (
            r.requestId,
            r.agent,
            r.amount,
            r.serviceId,
            r.provider,
            r.contentHash,
            r.timestamp
        );
    }

    /**
     * @notice Fetch full payment struct.
     */
    function getPaymentRecord(string calldata requestId) external view returns (PaymentRecord memory) {
        if (!processedRequests[requestId]) {
            revert RequestNotFound(requestId);
        }
        return payments[requestId];
    }

    /**
     * @notice Check if a request ID has already been settled.
     */
    function isProcessed(string calldata requestId) external view returns (bool) {
        return processedRequests[requestId];
    }

    /**
     * @notice Total number of settled payments.
     */
    function getPaymentCount() external view returns (uint256) {
        return requestIds.length;
    }

    /**
     * @notice Get all settled request IDs.
     */
    function getAllRequestIds() external view returns (string[] memory) {
        return requestIds;
    }
}
