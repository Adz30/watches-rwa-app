// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Minimal ERC20 interface (compatible with your Token.sol)
interface IERC20 {
    function decimals() external view returns (uint8);
    function balanceOf(address) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function allowance(address, address) external view returns (uint256);
    function transfer(address, uint256) external returns (bool);
    function transferFrom(address, address, uint256) external returns (bool);
}

// ---------------------------------------------
// Oracle interface: price per watchId
// price is in USDC with 18 decimals, per 1e18 fraction units
// ---------------------------------------------
interface IPriceOracle {
    function getPrice(uint256 watchId) external view returns (uint256 price18);
}

// ---------------------------------------------
// Simple mock oracle (for local testing)
// You can set per-watchId price manually.
// ---------------------------------------------
contract MockOracle is IPriceOracle {
    mapping(uint256 => uint256) public prices; // watchId => price (USDC, 18d)

    function setPrice(uint256 watchId, uint256 price18) external {
        prices[watchId] = price18;
    }

    function getPrice(
        uint256 watchId
    ) external view override returns (uint256) {
        uint256 p = prices[watchId];
        require(p > 0, "oracle: price not set");
        return p;
    }
}

// ---------------------------------------------
// AMM Pool (one per watchId)
// - Oracle-priced swaps (no x*y=k)
// - LP shares minted by contribution VALUE (in USDC terms via oracle)
// - Tracks by watchId, but also stores fraction token & USDC token
// ---------------------------------------------
contract AMM {
    // immutable config
    uint256 public immutable watchId;
    IERC20 public immutable fractionToken; // ERC20 fraction for this watchId
    IERC20 public immutable usdcToken; // USDC (assumed 18d here)
    IPriceOracle public priceOracle;

    // pool balances (bookkeeping mirrors actual token balances)
    uint256 public fractionBalance;
    uint256 public usdcBalance;

    // LP accounting
    uint256 public totalShares;
    mapping(address => uint256) public shares;
    uint256 constant PRECISION = 1e18;

    // Fees (bps). e.g. 30 = 0.30%
    uint256 public feeBps;
    address public feeRecipient;

    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 fractionIn,
        uint256 usdcIn,
        uint256 sharesMinted
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 fractionOut,
        uint256 usdcOut,
        uint256 sharesBurned
    );
    event Swap(
        address indexed user,
        address tokenGive,
        uint256 amountGive,
        address tokenGet,
        uint256 amountGet,
        uint256 priceUsed, // oracle price used (18d)
        uint256 timestamp
    );
    event FeeParamsUpdated(uint256 feeBps, address feeRecipient);
    event OracleUpdated(address oracle);

    constructor(
        uint256 _watchId,
        IERC20 _fractionToken,
        IERC20 _usdcToken,
        IPriceOracle _oracle,
        uint256 _feeBps,
        address _feeRecipient
    ) {
        require(address(_fractionToken) != address(0), "fraction token zero");
        require(address(_usdcToken) != address(0), "usdc token zero");
        require(address(_oracle) != address(0), "oracle zero");
        require(_feeBps <= 1000, "fee too high (>10%)"); // sanity

        // If your USDC is 6 decimals, you can enforce/convert here.
        // require(_usdcToken.decimals() == 18, "USDC must be 18d or add scaling");

        watchId = _watchId;
        fractionToken = _fractionToken;
        usdcToken = _usdcToken;
        priceOracle = _oracle;
        feeBps = _feeBps;
        feeRecipient = _feeRecipient;
    }

    // Admin-ish (could add Ownable if you like)
    function setFeeParams(uint256 _feeBps, address _feeRecipient) external {
        require(_feeBps <= 1000, "fee too high");
        require(_feeRecipient != address(0), "feeRecipient zero");
        // WARNING: gate this in production (e.g., onlyOwner)
        feeBps = _feeBps;
        feeRecipient = _feeRecipient;
        emit FeeParamsUpdated(_feeBps, _feeRecipient);
    }

    function setOracle(IPriceOracle _oracle) external {
        require(address(_oracle) != address(0), "oracle zero");
        // WARNING: gate this in production (e.g., onlyOwner)
        priceOracle = _oracle;
        emit OracleUpdated(address(_oracle));
    }

    // ----------------------------
    // Internal: get oracle price
    // price is USDC (18d) per 1e18 fraction units
    // ----------------------------
    function _price() internal view returns (uint256) {
        return priceOracle.getPrice(watchId);
    }
    function poolPrice() external view returns (uint256) {
        return _price();
    }

    // ----------------------------
    // LP: Add liquidity by VALUE
    // We mint shares proportional to the USD value of deposit at oracle price.
    // ----------------------------
    function addLiquidity(uint256 fractionAmount, uint256 usdcAmount) external {
        require(fractionAmount > 0 || usdcAmount > 0, "zero amounts");

        // --------------------------
        // Compute deposit value in USDC terms using oracle price
        // --------------------------
        uint256 price18 = _price();
        uint256 depositValue = (fractionAmount * price18) / 1e18 + usdcAmount;

        uint256 sharesToMint;
        if (totalShares == 0) {
            // seed pool with an arbitrary base to avoid dust issues
            sharesToMint = depositValue; // 1:1 to value
            if (sharesToMint < 1000) sharesToMint = 1000;
        } else {
            uint256 poolValue = (fractionBalance * price18) /
                1e18 +
                usdcBalance;
            sharesToMint = (depositValue * totalShares) / poolValue;
            require(sharesToMint > 0, "deposit too small");
        }

        // --------------------------
        // Pull tokens in AFTER calculating shares
        // --------------------------
        if (fractionAmount > 0) {
            require(
                fractionToken.transferFrom(
                    msg.sender,
                    address(this),
                    fractionAmount
                ),
                "fraction transfer failed"
            );
            fractionBalance += fractionAmount;
        }
        if (usdcAmount > 0) {
            require(
                usdcToken.transferFrom(msg.sender, address(this), usdcAmount),
                "USDC transfer failed"
            );
            usdcBalance += usdcAmount;
        }

        // --------------------------
        // Mint LP shares
        // --------------------------
        totalShares += sharesToMint;
        shares[msg.sender] += sharesToMint;

        emit LiquidityAdded(
            msg.sender,
            fractionAmount,
            usdcAmount,
            sharesToMint
        );
    }

    function removeLiquidity(uint256 shareAmount) external {
        require(
            shareAmount > 0 && shareAmount <= shares[msg.sender],
            "invalid share"
        );

        uint256 fractionOut = (fractionBalance * shareAmount) / totalShares;
        uint256 usdcOut = (usdcBalance * shareAmount) / totalShares;

        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;

        fractionBalance -= fractionOut;
        usdcBalance -= usdcOut;

        require(
            fractionToken.transfer(msg.sender, fractionOut),
            "fraction transfer failed"
        );
        require(
            usdcToken.transfer(msg.sender, usdcOut),
            "USDC transfer failed"
        );

        emit LiquidityRemoved(msg.sender, fractionOut, usdcOut, shareAmount);
    }

    // ----------------------------
    // View: Quotes (no fees applied here, frontends can apply fee preview)
    // ----------------------------
    function quoteFractionForUSDC(
        uint256 fractionIn
    ) external view returns (uint256 usdcOutNoFee, uint256 priceUsed) {
        priceUsed = _price();
        usdcOutNoFee = (fractionIn * priceUsed) / 1e18;
    }

    function quoteUSDCForFraction(
        uint256 usdcIn
    ) external view returns (uint256 fractionOutNoFee, uint256 priceUsed) {
        priceUsed = _price();
        fractionOutNoFee = (usdcIn * 1e18) / priceUsed;
    }

    // ----------------------------
    // Swap: Fraction -> USDC (oracle priced)
    // ----------------------------
    function swapFractionForUSDC(
        uint256 fractionIn,
        uint256 minUsdcOut
    ) external returns (uint256 usdcOut) {
        require(fractionIn > 0, "zero in");
        uint256 price18 = _price();
        uint256 totalSupply = fractionToken.totalSupply();

        uint256 gross = (fractionIn * price18) / totalSupply;
        uint256 fee = (gross * feeBps) / 10000;
        uint256 net = gross - fee;

        require(net >= minUsdcOut, "slippage");
        require(usdcBalance >= net, "insufficient USDC");

        require(
            fractionToken.transferFrom(msg.sender, address(this), fractionIn),
            "fraction transfer failed"
        );

        // update balances
        fractionBalance += fractionIn;
        usdcBalance -= net;

        if (fee > 0 && feeRecipient != address(0)) {
            require(
                usdcToken.transfer(feeRecipient, fee),
                "fee transfer failed"
            );
        }

        require(usdcToken.transfer(msg.sender, net), "USDC transfer failed");

        emit Swap(
            msg.sender,
            address(fractionToken),
            fractionIn,
            address(usdcToken),
            net,
            price18,
            block.timestamp
        );

        return net;
    }

    // ----------------------------
    // Swap: USDC -> Fraction (oracle priced)
    // ----------------------------
    function swapUSDCForFraction(
        uint256 usdcIn,
        uint256 minFractionOut
    ) external returns (uint256 fractionOut) {
        require(usdcIn > 0, "zero in");
        uint256 price18 = _price();
        uint256 totalSupply = fractionToken.totalSupply();

        uint256 fee = (usdcIn * feeBps) / 10000;
        uint256 netUsdcIn = usdcIn - fee;

        fractionOut = (netUsdcIn * totalSupply) / price18;
        require(fractionOut >= minFractionOut, "slippage");
        require(fractionBalance >= fractionOut, "insufficient fraction");

        require(
            usdcToken.transferFrom(msg.sender, address(this), usdcIn),
            "USDC transferFrom failed"
        );

        // update balances
        usdcBalance += netUsdcIn;
        fractionBalance -= fractionOut;

        if (fee > 0 && feeRecipient != address(0)) {
            require(
                usdcToken.transfer(feeRecipient, fee),
                "fee transfer failed"
            );
        }

        require(
            fractionToken.transfer(msg.sender, fractionOut),
            "fraction transfer failed"
        );

        emit Swap(
            msg.sender,
            address(usdcToken),
            usdcIn,
            address(fractionToken),
            fractionOut,
            price18,
            block.timestamp
        );

        return fractionOut;
    }
}

// ---------------------------------------------
// Factory: tracks pools BY watchId
// - one pool per watchId
// - stores fraction token & usdc token references
// ---------------------------------------------
contract AMMFactory {
    IPriceOracle public priceOracle;
    IERC20 public usdcToken;

    mapping(uint256 => address) public watchIdToPool; // watchId -> pool
    mapping(address => address) public fractionToPool; // fractionToken -> pool (optional reverse lookup)
    event PoolCreated(
        uint256 indexed watchId,
        address indexed fractionToken,
        address pool
    );

    constructor(IERC20 _usdcToken, IPriceOracle _oracle) {
        require(address(_usdcToken) != address(0), "USDC zero");
        require(address(_oracle) != address(0), "Oracle zero");
        // If USDC has 6 decimals, adapt AMM to scale amounts appropriately.
        // require(_usdcToken.decimals() == 18, "USDC must be 18d or add scaling");
        usdcToken = _usdcToken;
        priceOracle = _oracle;
    }

    function createPool(
        uint256 watchId,
        IERC20 fractionToken,
        uint256 feeBps,
        address feeRecipient
    ) external returns (address pool) {
        require(watchIdToPool[watchId] == address(0), "pool exists");
        require(
            fractionToPool[address(fractionToken)] == address(0),
            "token pooled"
        );
        require(address(fractionToken) != address(0), "fraction zero");

        AMM newPool = new AMM(
            watchId,
            fractionToken,
            usdcToken,
            priceOracle,
            feeBps,
            feeRecipient
        );

        watchIdToPool[watchId] = address(newPool);
        fractionToPool[address(fractionToken)] = address(newPool);

        emit PoolCreated(watchId, address(fractionToken), address(newPool));
        return address(newPool);
    }

    // Helpers
    function getPoolByWatch(uint256 watchId) external view returns (address) {
        return watchIdToPool[watchId];
    }

    function getPoolByFraction(
        address fractionToken
    ) external view returns (address) {
        return fractionToPool[fractionToken];
    }

    // Optional: update oracle for all NEW pools (existing pools store their oracle reference)
    function setOracle(IPriceOracle _oracle) external {
        // WARNING: gate this in production (e.g., onlyOwner)
        require(address(_oracle) != address(0), "oracle zero");
        priceOracle = _oracle;
    }
}
