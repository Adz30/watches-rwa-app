// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./WatchFraction.sol";

contract WatchFractionalizer is Ownable, ReentrancyGuard {
    using Strings for uint256;

    IERC721 public watchRegistry;          // NFT registry
    address public watchFractionImpl;      // WatchFraction implementation for cloning

    // Track fractionalized NFTs
    mapping(uint256 => address) public fractionalTokens;
    mapping(uint256 => bool) public isFractionalized;

    event Fractionalized(uint256 indexed tokenId, address fractionalToken, address owner);
    event Redeemed(uint256 indexed tokenId, address redeemer);

    constructor(address _watchRegistry, address _watchFractionImpl) Ownable(msg.sender) {
        require(_watchRegistry != address(0), "Invalid WatchRegistry");
        require(_watchFractionImpl != address(0), "Invalid WatchFraction implementation");

        watchRegistry = IERC721(_watchRegistry);
        watchFractionImpl = _watchFractionImpl;
    }

    /// @notice Fractionalize an NFT into ERC20 shares
    function fractionalize(uint256 tokenId, uint256 totalShares) external nonReentrant {
        require(!isFractionalized[tokenId], "Already fractionalized");
        require(watchRegistry.ownerOf(tokenId) == msg.sender, "Not owner");
        require(totalShares > 0, "Shares > 0");

        // Transfer NFT to this contract
        watchRegistry.transferFrom(msg.sender, address(this), tokenId);

        // Deploy minimal proxy clone
        address clone = Clones.clone(watchFractionImpl);

        // Initialize the clone
       WatchFraction(clone).initialize(
    string.concat("Watch ", tokenId.toString()),
    string.concat("W", tokenId.toString()),
    totalShares,
    msg.sender,       // initial ERC20 owner
    address(this)     // fractionalizer address
);

        fractionalTokens[tokenId] = clone;
        isFractionalized[tokenId] = true;

        emit Fractionalized(tokenId, clone, msg.sender);
    }

    /// @notice Redeem NFT by burning all ERC20 shares
    function redeem(uint256 tokenId) external nonReentrant {
        require(isFractionalized[tokenId], "Not fractionalized");
        address fractionAddress = fractionalTokens[tokenId];

        uint256 totalShares = WatchFraction(fractionAddress).totalSupply();
        require(WatchFraction(fractionAddress).balanceOf(msg.sender) == totalShares, "Not enough shares");

        // Burn ERC20 shares
        WatchFraction(fractionAddress).burnFromUser(msg.sender, totalShares);

        // Return NFT
        watchRegistry.transferFrom(address(this), msg.sender, tokenId);

        // Cleanup
        fractionalTokens[tokenId] = address(0);
        isFractionalized[tokenId] = false;

        emit Redeemed(tokenId, msg.sender);
    }

    /// @notice Get fractional token for NFT
    function getFractionalToken(uint256 tokenId) external view returns(address) {
        return fractionalTokens[tokenId];
    }
}
