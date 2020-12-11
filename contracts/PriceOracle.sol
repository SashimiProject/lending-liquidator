pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;


interface PriceOracle {

    function getUnderlyingPrice(address slToken) external view returns (uint);
    
    function postPrices(bytes[] calldata messages, bytes[] calldata signatures, string[] calldata symbols) external;
}
