// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract WatchFraction is Initializable, ERC20Upgradeable {
    address public fractionalizer;

    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        address owner_,
        address fractionalizer_
    ) external initializer {
        require(fractionalizer_ != address(0), "Invalid fractionalizer");
        fractionalizer = fractionalizer_;

        __ERC20_init(name_, symbol_);
        _mint(owner_, totalSupply_);
    }

    function burnFromUser(address user, uint256 amount) external {
        require(msg.sender == fractionalizer, "Not fractionalizer");
        _burn(user, amount);
    }
}
