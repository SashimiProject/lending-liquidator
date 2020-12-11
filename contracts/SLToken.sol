pragma solidity ^0.5.16;

interface SLErc20  {
    function liquidateBorrow(address borrower, uint repayAmount, address slTokenCollateral) external returns (uint);
}

interface SLEther {
    function liquidateBorrow(address borrower, address slTokenCollateral) external payable;
}

contract SLToken{
    address public underlying;
    function redeem(uint redeemTokens) external returns (uint);
    function balanceOf(address owner) external view returns (uint);
}