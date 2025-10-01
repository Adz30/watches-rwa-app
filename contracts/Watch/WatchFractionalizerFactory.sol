// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./WatchFraction.sol";


contract WatchFractionalizerFactory {
    using Strings for uint256;

    IERC721 public watchRegistry; // NFT registry
    address public implementation; // WatchFraction implementation

    // Track fractionalizers by NFT ID
    mapping(uint256 => address) public fractionalizersById;
    address[] public allFractionalizers;

    event FractionalizerCreated(
        uint256 indexed watchId,
        address fractionalizer,
        address owner
    );
    event Redeemed(uint256 indexed watchId, address redeemer);

    constructor(address _implementation, address _watchRegistry) {
        require(_implementation != address(0), "Invalid implementation");
        require(_watchRegistry != address(0), "Invalid registry");

        implementation = _implementation;
        watchRegistry = IERC721(_watchRegistry);
    }

    /// @notice Fractionalize an NFT into ERC20 shares
    function fractionalize(
        uint256 watchId,
        uint256 totalShares
    ) external returns (address) {
        require(
            fractionalizersById[watchId] == address(0),
            "Already fractionalized"
        );
        require(watchRegistry.ownerOf(watchId) == msg.sender, "Not NFT owner");
        require(totalShares > 0, "Shares > 0");

        // Transfer NFT to factory
        watchRegistry.transferFrom(msg.sender, address(this), watchId);

        // Deploy minimal proxy clone
        address clone = Clones.clone(implementation);

        // Initialize the clone
        WatchFraction(clone).initialize(
            string.concat("Watch ", Strings.toString(watchId)),
            string.concat("W", Strings.toString(watchId)),
            totalShares,
            msg.sender, // initial ERC20 owner
            address(this) // fractionalizer address
        );

        fractionalizersById[watchId] = clone;
        allFractionalizers.push(clone);

        emit FractionalizerCreated(watchId, clone, msg.sender);
        return clone;
    }

    /// @notice Redeem full NFT by burning all ERC20 shares
    function redeem(uint256 watchId) external {
    address fractionAddress = fractionalizersById[watchId];
    require(fractionAddress != address(0), "Not fractionalized");

    WatchFraction fraction = WatchFraction(fractionAddress);
    uint256 totalShares = fraction.totalSupply();
    uint256 userBalance = fraction.balanceOf(msg.sender);

    // Require at least 99% of fractions
    require(userBalance * 100 / totalShares >= 99, "Need >=99% of fractions");

    // Burn user fractions
    fraction.burnFromUser(msg.sender, userBalance);

    // Return NFT
    watchRegistry.transferFrom(address(this), msg.sender, watchId);

    // Optional: keep fractionalizer record for tracking
    fractionalizersById[watchId] = address(0);

    emit Redeemed(watchId, msg.sender);
}

    /// @notice Get fractionalizer address for a specific NFT
    function getFractionalizer(
        uint256 watchId
    ) external view returns (address) {
        return fractionalizersById[watchId];
    }

    /// @notice List all fractionalizers ever created
    function getAllFractionalizers() external view returns (address[] memory) {
        return allFractionalizers;
    }
}
