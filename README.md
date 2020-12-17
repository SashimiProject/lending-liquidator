# Lending Liquidator
Lending liquidator is a bot for liquidating unhealthy accounts in Sashimi Lending protocol. It can find unhealthy accounts and liquidate them automatically.The bot is mainly composed of smart contract and Web3.js script.

## Contract

[SashimiLendingLiquidation](contracts/SashimiLendingLiquidation.sol) is the smart contract for liquidation, it is used to clear unhealthy accounts.

The contract has two main interfaces:

### liquidateBorrow

liquidateBorrow is mainly used for liquidation. The method is to use ETH to settle all borrowed tokens of unhealthy accounts in this contract. The method consists of the following steps:

1. Transfer ETH to contract address and exchange ETH for token to be liquidated in DEX.

2. Use the token received to liquidate unhealthy account, obtain the slToken of the borrower's collateral.

3. Redeem the slToken obtained by liquidation and exchange for ETH in DEX.

4. Judge whether the number of ETH obtained is greater than that of the step one above. If no, revert the transaction. Otherwise continue.

5. Transfer ETH out from the contract.

### setSashimiswapToken

This contract method can set the DEX to be used for token swap. Uniswap is used by default. If token is set to be true, Sashimiswap is used.

## Web3.js Script

[liquidate.js](scripts/liquidate.js) the Web3.js script of lending liquidator, which is used to find the unhealthy accounts and send transaction of [SashimiLendingLiquidation](contracts/SashimiLendingLiquidation.sol) to liquidate unhealthy accounts. The script consists of the following steps:

1. Call API(https://lending.sashimi.cool/api/loan/unhealthyAccounts) to query unhealthy accounts and deal with them one by one.

2. Select the borrowed token with the largest total value and the collateral token with the largest total value to calculate the payoff that can be obtained by liquidation.

3. Estimate the fee for  calling liquidation contract method, and Judge whether it is greater than the payoff calculated in the step two above. If no, skip this unhealty account. Otherwise continue.

4. Call liquidateBorrow method of [SashimiLendingLiquidation](contracts/SashimiLendingLiquidation.sol) to liquidate the unhealty account.

## How to use

1. To fetch dependencies run:

```
yarn
```

2. To compile contract run:

```
truffle compile
```

3. Deploy contract [SashimiLendingLiquidation](contracts/SashimiLendingLiquidation.sol)

4. Create info.json with your private information. Refer [info.json.template](info.json.template).

5. Execute the script

```
cd /your/path/lending-liquidator
node scripts/liquidate.js
```
