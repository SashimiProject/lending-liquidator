pragma solidity ^0.5.16;

import "./interfaces/IUniswapV2Router02.sol"; 
import "./SLToken.sol";
import "./TransferHelper.sol";

contract SashimiLendingLiquidation {
    IUniswapV2Router02 public uniswapRouter;
    IUniswapV2Router02 public sashimiswapRouter;
    mapping(address => bool) public sashimiswapToken;
    address public slETH;
    address public WETH;
    address public owner;

    constructor(IUniswapV2Router02 uniswapRouter_, IUniswapV2Router02 sashimiswapRouter_, address slETH_, address WETH_) public {
        uniswapRouter = uniswapRouter_;
        sashimiswapRouter = sashimiswapRouter_;
        slETH = slETH_;
        WETH = WETH_;
        owner = msg.sender;
    }

    function() external payable {}

    modifier onlyOwner() {
        require(owner == msg.sender, "caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        owner = newOwner;
    }

    function liquidateBorrow(address slTokenBorrowed, address borrower, uint repayAmount, address slTokenCollateral) public payable onlyOwner returns (uint) {
        if(slTokenBorrowed != slETH){
            address tokenBorrowed = SLToken(slTokenBorrowed).underlying();
            swapETHForTokenBorrowed(tokenBorrowed, repayAmount); //swap ETH to borrowed token
            TransferHelper.safeApprove(tokenBorrowed, slTokenBorrowed, repayAmount);
            uint err = SLErc20(slTokenBorrowed).liquidateBorrow(borrower, repayAmount, slTokenCollateral);
            require(err == 0,"liquidateBorrow failed");            
        }else{ //no need to swap, if slTokenBorrowed is slETH
            SLEther(slTokenBorrowed).liquidateBorrow.value(repayAmount)(borrower, slTokenCollateral);
        }
        uint redeemTokens = SLToken(slTokenCollateral).balanceOf(address(this));
        SLToken(slTokenCollateral).redeem(redeemTokens);

        if(slTokenCollateral != slETH){ //need to swap for eth, if slTokenCollateral is not slETH
            address tokenCollateral = SLToken(slTokenCollateral).underlying();
            swapTokenForETH(tokenCollateral, SLToken(tokenCollateral).balanceOf(address(this))); //swap token to ETH
        }
        uint balance = address(this).balance;
        require(balance > msg.value, "earn failed"); //eth should be increased
        doTransferOut(msg.sender, balance); //transfer eth back to sender
    }

    function setSashimiswapToken(address token, bool flag) external onlyOwner{
        sashimiswapToken[token] = flag;
    }

    function swapETHForTokenBorrowed(address token,uint amountOut) internal{
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = token;
        IUniswapV2Router02 router = getRouter(token);
        router.swapETHForExactTokens.value(msg.value)(amountOut, path, address(this), block.timestamp + 3);
    }

    function swapTokenForETH(address token,uint amountIn) internal{
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = WETH;
        IUniswapV2Router02 router = getRouter(token);
        TransferHelper.safeApprove(token, address(router), amountIn);        
        router.swapExactTokensForETH(amountIn, 0, path, address(this), block.timestamp + 3); 
    }

    function getRouter(address token) internal view returns (IUniswapV2Router02){
        if(sashimiswapToken[token]){
            return sashimiswapRouter;
        }else{
            return uniswapRouter;
        }
    }

    function doTransferOut(address payable to, uint amount) internal {
        /* Send the Ether, with minimal gas and revert on failure */
        to.transfer(amount);
    }
}