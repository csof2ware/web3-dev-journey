// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Token "portão": só quem o possui pode claimar (custo econômico anti-Sybil)
contract MockERC20 is ERC20 {
    constructor() ERC20("GateToken", "GATE") {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
