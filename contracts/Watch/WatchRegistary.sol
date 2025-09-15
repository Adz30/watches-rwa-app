// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WatchRegistry is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    mapping(uint256 => string) private _tokenURIs;
    mapping(address => uint256[]) private _ownedTokens;

    // Pass msg.sender to Ownable constructor
    constructor()
        ERC721("Luxury Watch Registry", "WATCH")
        Ownable(msg.sender)
    {}

    //authenticator mints NFT of the watch currently onlyOwner
    function mintWatch(address to, string memory uri) external onlyOwner {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(to, newTokenId);
        _tokenURIs[newTokenId] = uri;

        _ownedTokens[to].push(newTokenId);
    }

    // function to view token URI
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(
            _ownerOf(tokenId) != address(0),
            "WatchRegistry: URI query for nonexistent token"
        );
        return _tokenURIs[tokenId];
    }
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
    return _ownedTokens[owner];
    }
}
