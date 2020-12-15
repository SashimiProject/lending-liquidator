pragma solidity ^0.5.16;

interface Comptroller {
    function getAccountLiquidity(address account) external view returns (uint, uint, uint);
    function claimSashimi(address holder, address[] calldata slTokens) external;
}