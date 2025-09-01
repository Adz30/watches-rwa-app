// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Minimal price oracle interface (returns price in USDC with 18 decimals)
interface IPriceOracle {
    function getPrice(uint256 nftId) external view returns (uint256);
}

contract NFTCollateralLending is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IERC721 public immutable nftContract;

    uint256 public totalPoolUSDC; // synthetic accounting of pool (in USDC smallest unit)
    uint256 public totalShares; // total shares for LPs
    uint256 public interestRateBP; // e.g., 200 = 2% per loan (basis points)

    struct Lender {
        uint256 shares; // proportional claim on pool
    }

    struct Loan {
        address borrower;
        uint256 nftId;
        uint256 borrowedAmount;
        bool repaid;
    }

    mapping(address => Lender) public lenders;
    mapping(uint256 => Loan) public loans; // nftId => Loan

    address public oracle; // price oracle address
    uint256 public collateralRatioBP; // e.g., 80% = 8000

    // Events
    event Deposit(address indexed lender, uint256 amount, uint256 shares);
    event Withdraw(address indexed lender, uint256 amount, uint256 shares);
    event LoanTaken(address indexed borrower, uint256 nftId, uint256 amount);
    event LoanRepaid(address indexed borrower, uint256 nftId, uint256 amount);

    constructor(
        address _usdc,
        address _nft,
        address _oracle,
        uint256 _collateralRatioBP,
        uint256 _interestRateBP
    ) {
        require(_usdc != address(0), "usdc addr zero");
        require(_nft != address(0), "nft addr zero");
        require(_oracle != address(0), "oracle addr zero");
        require(
            _collateralRatioBP > 0 && _collateralRatioBP <= 10000,
            "bad collateralRatio"
        );
        require(_interestRateBP <= 10000, "bad interestRate");

        usdc = IERC20(_usdc);
        nftContract = IERC721(_nft);
        oracle = _oracle;
        collateralRatioBP = _collateralRatioBP;
        interestRateBP = _interestRateBP;
    }

    // ========== Lender functions ==========
    /// @notice Deposit USDC into the pool. Handles fee-on-transfer tokens by using balance-delta.
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Must deposit >0");

        uint256 before = usdc.balanceOf(address(this));
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = usdc.balanceOf(address(this)) - before;
        require(received > 0, "No USDC received");

        uint256 shares;
        if (totalShares == 0) {
            // first LP: 1:1 shares to received
            shares = received;
        } else {
            // proportional shares to maintain fairness with existing LPs
            require(totalPoolUSDC > 0, "Pool accounting error");
            shares = (received * totalShares) / totalPoolUSDC;
        }

        lenders[msg.sender].shares += shares;
        totalShares += shares;
        totalPoolUSDC += received;

        emit Deposit(msg.sender, received, shares);
    }

    /// @notice Withdraw USDC by burning LP shares.
    function withdraw(uint256 shareAmount) external nonReentrant {
        require(shareAmount > 0, "shareAmount > 0");
        require(
            lenders[msg.sender].shares >= shareAmount,
            "Insufficient shares"
        );
        require(totalShares > 0, "No shares in pool");

        uint256 usdcAmount = (shareAmount * totalPoolUSDC) / totalShares;

        // Effects
        lenders[msg.sender].shares -= shareAmount;
        totalShares -= shareAmount;
        totalPoolUSDC -= usdcAmount;

        // Interaction
        usdc.safeTransfer(msg.sender, usdcAmount);
        emit Withdraw(msg.sender, usdcAmount, shareAmount);
    }

    // ========== Borrower functions ==========
    /// @notice Deposit an NFT as collateral and borrow USDC (all-or-nothing loan).
    function depositNFTAndBorrow(uint256 nftId) external nonReentrant {
        Loan storage existing = loans[nftId];
        require(
            existing.borrower == address(0) || existing.repaid,
            "Active loan exists"
        );

        uint256 nftValue = IPriceOracle(oracle).getPrice(nftId);
        uint256 borrowable = (nftValue * collateralRatioBP) / 10000;
        require(borrowable > 0, "Nothing borrowable");
        require(borrowable <= totalPoolUSDC, "Not enough liquidity");

        // Transfer NFT (will revert if not owner/approved)
        nftContract.transferFrom(msg.sender, address(this), nftId);

        // Effects
        loans[nftId] = Loan({
            borrower: msg.sender,
            nftId: nftId,
            borrowedAmount: borrowable,
            repaid: false
        });
        totalPoolUSDC -= borrowable;

        // Interaction
        usdc.safeTransfer(msg.sender, borrowable);

        emit LoanTaken(msg.sender, nftId, borrowable);
    }

    /// @notice Repay full loan (principal + interest) in one transaction. NFT returned on full repayment.
    function repayLoan(uint256 nftId) external nonReentrant {
        Loan storage loan = loans[nftId];
        require(loan.borrower == msg.sender, "Not your loan");
        require(!loan.repaid, "Already repaid");
        require(
            nftContract.ownerOf(nftId) == address(this),
            "Collateral missing"
        );

        uint256 interest = (loan.borrowedAmount * interestRateBP) / 10000;
        uint256 repayment = loan.borrowedAmount + interest;

        uint256 before = usdc.balanceOf(address(this));
        usdc.safeTransferFrom(msg.sender, address(this), repayment);
        uint256 received = usdc.balanceOf(address(this)) - before;
        require(received == repayment, "Wrong repayment amount");

        // Effects
        loan.repaid = true;
        totalPoolUSDC += received;

        

        // Interaction - return NFT to borrower
        nftContract.transferFrom(address(this), msg.sender, nftId);

        emit LoanRepaid(msg.sender, nftId, repayment);
    }

    // ========== Views & helpers ==========
    function getLender(
        address user
    ) external view returns (uint256 shares, uint256 usdcValue) {
        shares = lenders[user].shares;
        usdcValue = (totalShares == 0)
            ? 0
            : (shares * totalPoolUSDC) / totalShares;
    }

    function getLoan(
        uint256 nftId
    )
        external
        view
        returns (address borrower, uint256 borrowedAmount, bool repaid)
    {
        Loan storage loan = loans[nftId];
        return (loan.borrower, loan.borrowedAmount, loan.repaid);
    }

    function getPoolInfo()
        external
        view
        returns (uint256 _totalPoolUSDC, uint256 _totalShares)
    {
        return (totalPoolUSDC, totalShares);
    }

    /// @notice Sync synthetic accounting with on-chain USDC balance.
    /// Useful if USDC is accidentally transferred directly to the contract.
    function sync() external {
        totalPoolUSDC = usdc.balanceOf(address(this));
    }
}
