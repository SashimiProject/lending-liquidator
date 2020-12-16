# Lending Liquidator
Lending liquidator is a bot for liquidating sashimi lending unhealthy accounts. It can found unhealthy account and liquidate them automatically.The bot is mainly composed of smart contract and Web3.js script.

## Contract

[SashimiLendingLiquidation](contracts/SashimiLendingLiquidation.sol) is the smart contract for liquidation, which is mainly used to clear unhealthy accounts.

The contract has two main interfaces:

### liquidateBorrow

liquidateBorrow is mainly used for liquidation. This contract method can use eth to clear all borrow tokens. The method consists of the following steps:

1. Transfer eth to contract and use eth to exchange token in DEX

2. Use the token exchanged to liquidate unhealthy account, and obtain the slToken of the borrower's collateral.

3. Redeem the slToken obtained by liquidation and exchange it into eth in DEX

4. Judge whether the number of eth converted at last is greater than that of the step one above.If not,revert the transaction.Otherwise continue.

5. Transfer ETH in the contract out

### setSashimiswapToken

This contract method can set the DEX used by token. By default, uniswap is used as DEX. If token is set to true, sashimiswap is used for it.

## Web3.js Script

[liquidate.js](scripts/liquidate.js) is the Web3.js script of lending liquidator, which is mainly used to find the unhealthy accounts and send transaction of [SashimiLendingLiquidation](contracts/SashimiLendingLiquidation.sol) to liquidate unhealthy accounts. The script consists of the following steps:

1. Call API(https://lending.sashimi.cool/api/loan/unhealthyAccounts) to query unhealthy accounts and deal with them one by one.

2. Select the borrow token with the largest total value and the collateral token with the largest total value to calculate the income that can be obtained after liquidation

3. Estimate the fee used in calling liquidation contract method, and Judge whether it is greater than the income calculated in the step two above. If not,skip this unhealty account.Otherwise continue.

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
