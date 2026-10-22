// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title SavingsVault
/// @notice Non-custodial savings goals in native DOGE. No yield, no lockups, no admin.
contract SavingsVault is ReentrancyGuard {
  struct Goal {
    address owner;
    string name;
    uint256 target;
    uint256 balance;
    uint256 totalDeposited;
    uint256 totalWithdrawn;
    uint64 createdAt;
    bool closed;
  }

  uint256 public constant MAX_NAME_LENGTH = 40;
  uint256 public constant MAX_GOALS_PER_USER = 20;

  Goal[] private _goals;
  mapping(address => uint256[]) private _goalsOf;
  uint256 public totalHeld;

  error GoalNotFound();
  error NotGoalOwner();
  error GoalClosedError();
  error ZeroAmount();
  error InvalidName();
  error InvalidTarget();
  error TooManyGoals();
  error InsufficientBalance();
  error TransferFailed();
  error DirectTransferNotAllowed();

  event GoalCreated(uint256 indexed goalId, address indexed owner, string name, uint256 target);
  event Deposited(uint256 indexed goalId, address indexed owner, uint256 amount, uint256 newBalance);
  event Withdrawn(uint256 indexed goalId, address indexed owner, uint256 amount, uint256 newBalance);
  event GoalClosed(uint256 indexed goalId, address indexed owner, uint256 refunded);

  // ---------------------------------------------------------------------------
  // Mutating functions
  // ---------------------------------------------------------------------------

  function createGoal(string calldata name, uint256 target) external returns (uint256 goalId) {
    return _createGoal(name, target);
  }

  function createGoalAndDeposit(
    string calldata name,
    uint256 target
  ) external payable nonReentrant returns (uint256 goalId) {
    goalId = _createGoal(name, target);
    if (msg.value > 0) {
      _credit(goalId, msg.value);
    }
  }

  function deposit(uint256 goalId) external payable nonReentrant {
    Goal storage g = _ownedGoal(goalId);
    if (g.closed) revert GoalClosedError();
    if (msg.value == 0) revert ZeroAmount();
    _credit(goalId, msg.value);
  }

  function withdraw(uint256 goalId, uint256 amount) external nonReentrant {
    Goal storage g = _ownedGoal(goalId);
    if (amount == 0) revert ZeroAmount();
    if (amount > g.balance) revert InsufficientBalance();

    uint256 newBalance;
    unchecked {
      newBalance = g.balance - amount;
    }
    g.balance = newBalance;
    g.totalWithdrawn += amount;
    totalHeld -= amount;

    _send(msg.sender, amount);
    emit Withdrawn(goalId, msg.sender, amount, newBalance);
  }

  function closeGoal(uint256 goalId) external nonReentrant {
    Goal storage g = _ownedGoal(goalId);
    if (g.closed) revert GoalClosedError();

    uint256 refund = g.balance;
    g.closed = true;
    if (refund > 0) {
      g.balance = 0;
      g.totalWithdrawn += refund;
      totalHeld -= refund;
      _send(msg.sender, refund);
    }
    emit GoalClosed(goalId, msg.sender, refund);
  }

  // ---------------------------------------------------------------------------
  // Views
  // ---------------------------------------------------------------------------

  function getGoal(uint256 goalId) external view returns (Goal memory) {
    if (goalId >= _goals.length) revert GoalNotFound();
    return _goals[goalId];
  }

  function goalsOf(address owner) external view returns (uint256[] memory) {
    return _goalsOf[owner];
  }

  function getGoalsOf(address owner) external view returns (Goal[] memory goals, uint256[] memory ids) {
    ids = _goalsOf[owner];
    uint256 len = ids.length;
    goals = new Goal[](len);
    for (uint256 i = 0; i < len; ) {
      goals[i] = _goals[ids[i]];
      unchecked {
        i++;
      }
    }
  }

  function goalCount() external view returns (uint256) {
    return _goals.length;
  }

  // ---------------------------------------------------------------------------
  // Direct transfers are rejected
  // ---------------------------------------------------------------------------

  receive() external payable {
    revert DirectTransferNotAllowed();
  }

  fallback() external payable {
    revert DirectTransferNotAllowed();
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  function _createGoal(string calldata name, uint256 target) internal returns (uint256 goalId) {
    uint256 nameLen = bytes(name).length;
    if (nameLen == 0 || nameLen > MAX_NAME_LENGTH) revert InvalidName();
    if (target == 0) revert InvalidTarget();
    if (_goalsOf[msg.sender].length >= MAX_GOALS_PER_USER) revert TooManyGoals();

    goalId = _goals.length;
    _goals.push(
      Goal({
        owner: msg.sender,
        name: name,
        target: target,
        balance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        createdAt: uint64(block.timestamp),
        closed: false
      })
    );
    _goalsOf[msg.sender].push(goalId);

    emit GoalCreated(goalId, msg.sender, name, target);
  }

  function _credit(uint256 goalId, uint256 amount) internal {
    Goal storage g = _goals[goalId];
    uint256 newBalance = g.balance + amount;
    g.balance = newBalance;
    g.totalDeposited += amount;
    totalHeld += amount;
    emit Deposited(goalId, g.owner, amount, newBalance);
  }

  function _ownedGoal(uint256 goalId) internal view returns (Goal storage g) {
    if (goalId >= _goals.length) revert GoalNotFound();
    g = _goals[goalId];
    if (g.owner != msg.sender) revert NotGoalOwner();
  }

  function _send(address to, uint256 amount) internal {
    (bool ok, ) = payable(to).call{value: amount}("");
    if (!ok) revert TransferFailed();
  }
}
