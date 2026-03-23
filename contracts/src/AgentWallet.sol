// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AgentWallet
/// @notice A wallet contract for AI agents with spending caps, daily limits,
///         token allowlisting, pause functionality, and reentrancy protection.
/// @dev Owner = the human principal. Operator = the AI agent address.
contract AgentWallet is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ──────────────────── Errors ────────────────────
    error TokenNotAllowed(address token);
    error ExceedsTransactionCap(uint256 amount, uint256 cap);
    error ExceedsDailyLimit(uint256 amount, uint256 remaining);
    error ZeroAddress();
    error ZeroAmount();
    error NotOperator();
    error InsufficientBalance(uint256 requested, uint256 available);

    // ──────────────────── Events ────────────────────
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);
    event TokenAllowlisted(address indexed token, bool allowed);
    event TransactionCapUpdated(address indexed token, uint256 cap);
    event DailyLimitUpdated(address indexed token, uint256 limit);
    event Spent(address indexed token, address indexed to, uint256 amount);
    event Deposited(address indexed token, address indexed from, uint256 amount);
    event EthWithdrawn(address indexed to, uint256 amount);

    // ──────────────────── Constants ────────────────────
    address public constant ETH = address(0);

    // ──────────────────── State ────────────────────
    address public operator;

    mapping(address token => bool) public allowlisted;
    mapping(address token => uint256) public transactionCap;
    mapping(address token => uint256) public dailyLimit;

    struct DailyUsage {
        uint256 spent;
        uint256 dayStart; // timestamp of the start of the current tracking day
    }

    mapping(address token => DailyUsage) public dailyUsage;

    // ──────────────────── Modifiers ────────────────────
    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    modifier onlyAllowed(address token) {
        if (!allowlisted[token]) revert TokenNotAllowed(token);
        _;
    }

    // ──────────────────── Constructor ────────────────────
    constructor(address _owner, address _operator) Ownable(_owner) {
        if (_operator == address(0)) revert ZeroAddress();
        operator = _operator;
        emit OperatorUpdated(address(0), _operator);
    }

    // ──────────────────── Receive ETH ────────────────────
    receive() external payable {
        emit Deposited(ETH, msg.sender, msg.value);
    }

    // ══════════════════════════════════════════════════════
    //                   OWNER FUNCTIONS
    // ══════════════════════════════════════════════════════

    /// @notice Replace the operator (agent) address.
    function setOperator(address _operator) external onlyOwner {
        if (_operator == address(0)) revert ZeroAddress();
        emit OperatorUpdated(operator, _operator);
        operator = _operator;
    }

    /// @notice Add or remove a token from the allowlist.
    /// @dev Use ETH (address(0)) to allowlist native ETH.
    function setAllowlisted(address token, bool allowed) external onlyOwner {
        allowlisted[token] = allowed;
        emit TokenAllowlisted(token, allowed);
    }

    /// @notice Set the per-transaction spending cap for a token.
    /// @param cap Maximum amount per single spend. 0 = no cap.
    function setTransactionCap(address token, uint256 cap) external onlyOwner {
        transactionCap[token] = cap;
        emit TransactionCapUpdated(token, cap);
    }

    /// @notice Set the rolling 24-hour daily spending limit for a token.
    /// @param limit Maximum daily spend. 0 = no daily limit.
    function setDailyLimit(address token, uint256 limit) external onlyOwner {
        dailyLimit[token] = limit;
        emit DailyLimitUpdated(token, limit);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Owner can withdraw any ERC-20 (emergency / sweep).
    function withdrawToken(address token, address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        IERC20(token).safeTransfer(to, amount);
    }

    /// @notice Owner can withdraw ETH.
    function withdrawETH(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount > address(this).balance) {
            revert InsufficientBalance(amount, address(this).balance);
        }
        emit EthWithdrawn(to, amount);
        (bool ok,) = to.call{value: amount}("");
        require(ok, "ETH transfer failed");
    }

    // ══════════════════════════════════════════════════════
    //                  OPERATOR FUNCTIONS
    // ══════════════════════════════════════════════════════

    /// @notice Spend an ERC-20 token. Only the operator can call this.
    function spend(address token, address to, uint256 amount)
        external
        onlyOperator
        whenNotPaused
        nonReentrant
        onlyAllowed(token)
    {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        _enforceTransactionCap(token, amount);
        _enforceDailyLimit(token, amount);

        emit Spent(token, to, amount);
        IERC20(token).safeTransfer(to, amount);
    }

    /// @notice Spend native ETH. Only the operator can call this.
    function spendETH(address payable to, uint256 amount)
        external
        onlyOperator
        whenNotPaused
        nonReentrant
        onlyAllowed(ETH)
    {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (amount > address(this).balance) {
            revert InsufficientBalance(amount, address(this).balance);
        }
        _enforceTransactionCap(ETH, amount);
        _enforceDailyLimit(ETH, amount);

        emit Spent(ETH, to, amount);
        (bool ok,) = to.call{value: amount}("");
        require(ok, "ETH transfer failed");
    }

    // ══════════════════════════════════════════════════════
    //                  VIEW FUNCTIONS
    // ══════════════════════════════════════════════════════

    /// @notice Returns the remaining daily allowance for a token.
    function dailyRemaining(address token) external view returns (uint256) {
        uint256 limit = dailyLimit[token];
        if (limit == 0) return type(uint256).max;

        DailyUsage storage usage = dailyUsage[token];
        if (_isNewDay(usage.dayStart)) return limit;
        if (usage.spent >= limit) return 0;
        return limit - usage.spent;
    }

    // ══════════════════════════════════════════════════════
    //                  INTERNAL HELPERS
    // ══════════════════════════════════════════════════════

    function _enforceTransactionCap(address token, uint256 amount) internal view {
        uint256 cap = transactionCap[token];
        if (cap != 0 && amount > cap) {
            revert ExceedsTransactionCap(amount, cap);
        }
    }

    function _enforceDailyLimit(address token, uint256 amount) internal {
        uint256 limit = dailyLimit[token];
        if (limit == 0) return; // no limit set

        DailyUsage storage usage = dailyUsage[token];

        if (_isNewDay(usage.dayStart)) {
            usage.spent = 0;
            usage.dayStart = _currentDayStart();
        }

        uint256 remaining = limit - usage.spent;
        if (amount > remaining) {
            revert ExceedsDailyLimit(amount, remaining);
        }
        usage.spent += amount;
    }

    function _isNewDay(uint256 dayStart) internal view returns (bool) {
        return block.timestamp >= dayStart + 1 days;
    }

    function _currentDayStart() internal view returns (uint256) {
        return (block.timestamp / 1 days) * 1 days;
    }
}
