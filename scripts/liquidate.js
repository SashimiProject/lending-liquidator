const Web3 = require('web3');
const info = require('../info.json');
const lendingConfig = require("./lending-config");
const SashimiLendingLiquidation = require("../build/contracts/SashimiLendingLiquidation.json");
const Comptroller = require('../build/contracts/Comptroller.json');
const PriceOracle = require("../build/contracts/PriceOracle.json");
const argv = require('minimist')(process.argv.slice(2), {string: ['network']});
const fetch = require('node-fetch');
const { URL, URLSearchParams } = require('url');
const HttpsProxyAgent = require('https-proxy-agent');
const BigNumber = require('bignumber.js');
const schedule = require('node-schedule');

let config;

console.log(`network: ${argv['network']}\n`);
if (argv['network'] === 'kovan') {
    config = lendingConfig.networks.kovan;
} else if (argv['network'] === 'mainnet') {
    config = lendingConfig.networks.mainnet;
}
console.log("Init web3");
let web3 = new Web3(config.provider());
web3.eth.defaultAccount=info.addresses.liquidator;

async function fetch_get(url){
  return await fetch(url);
}

async function getGasPrice(){
    try{
        let url = new URL(config.api.etherscan);
        let params = {
          "module": "gastracker",
          "action": "gasoracle",
          "apikey": info.api_etherscan
        };
        url.search = new URLSearchParams(params).toString();
        let response = await fetch_get(url);
        let gasOracle = await response.json();
        if(gasOracle.status != "1" || gasOracle.message !="OK"){
            //TODO Add retry logic
        }
        console.log(gasOracle.result.FastGasPrice);
        return new web3.utils.BN(parseInt(gasOracle.result.FastGasPrice) * 10**9);
    }
    catch(e){
        console.log(e)
    }
}

async function getETHPrice(){
    let priceOracle = new web3.eth.Contract(PriceOracle.abi, config.contracts.priceOracle);
    var ethOraclePrice = await priceOracle.methods.getUnderlyingPrice(config.contracts.slETH).call(); 
    return web3.utils.toBN(ethOraclePrice);
}

async function main(){
    console.log("start");
    
    let comptroller = new web3.eth.Contract(Comptroller.abi, config.contracts.comptroller);
    let sashimiLendingLiquidation = new web3.eth.Contract(SashimiLendingLiquidation.abi, config.contracts.sashimiLendingLiquidation);
    try {
        let response = await fetch_get(config.api.lending);
        let result = await response.json();
        if(result.code != 0){
            console.log(result); 
        }
        let gasPrice = await getGasPrice();
        let unhealthyAccounts = [];
        for (const account of result.data) {
            let accountLiquidity = await comptroller.methods.getAccountLiquidity(account.address).call();
            if(accountLiquidity['1'] > 0) continue;
            let unhealthyAccount = {};
            unhealthyAccount.debt = [];
            unhealthyAccount.collateral = [];
            unhealthyAccount.address = account.address;
            unhealthyAccount.total_borrow_value_in_usd = new BigNumber(account.totalBorrowValueInUSD);
            account.tokens.forEach(token => {
                let slToken = {};
                slToken.symbol = token.symbol;
                slToken.underlying_decimals = token.market.underlyingDecimals;
                slToken.underlying_price = new BigNumber(token.market.underlyingPriceUSD);
                slToken.address = token.address;
                slToken.borrow_balance_underlying = new BigNumber(token.storedBorrowBalance);
                slToken.borrow_balance_underlying_in_usd = slToken.underlying_price.times(slToken.borrow_balance_underlying);
                slToken.supply_balance_underlying = (new BigNumber(token.cTokenBalance)).times(token.market.exchangeRate);
                slToken.supply_balance_underlying_in_usd = slToken.underlying_price.times(slToken.supply_balance_underlying);
                if (slToken.borrow_balance_underlying > 0) {
                    unhealthyAccount.debt.push(slToken);
                }
                if (slToken.supply_balance_underlying > 0) {
                    unhealthyAccount.collateral.push(slToken);
                }
            });
            unhealthyAccount.debt.sort((a, b) => b.borrow_balance_underlying_in_usd.comparedTo(a.borrow_balance_underlying_in_usd));
            unhealthyAccount.collateral.sort((a, b) => b.supply_balance_underlying_in_usd.comparedTo(a.supply_balance_underlying_in_usd));
            unhealthyAccounts.push(unhealthyAccount);
        };
        let ethPrice;
        if(unhealthyAccounts.length > 0){
            ethPrice = await getETHPrice();
            unhealthyAccounts.sort((a, b) => b.total_borrow_value_in_usd.comparedTo(a.total_borrow_value_in_usd));
        }
        for (const unhealthyAccount of unhealthyAccounts) {
            let liquidationAmount = unhealthyAccount.debt[0].borrow_balance_underlying.times(config.lending_parameters.close_factor);
            let expectedCollateral = unhealthyAccount.debt[0].borrow_balance_underlying_in_usd.times(config.lending_parameters.close_factor).times(config.lending_parameters.liquidation_incentive);
            const actualCollateral = unhealthyAccount.collateral[0].supply_balance_underlying_in_usd;
            if (expectedCollateral.gt(actualCollateral)) {
                liquidationAmount = actualCollateral.div(unhealthyAccount.debt[0].underlying_price.times(config.lending_parameters.liquidation_incentive));
                console.log(liquidationAmount.toString());
                expectedCollateral = actualCollateral;
            }
            let expectedGasAmount = 0;
            if (unhealthyAccount.debt[0].symbol === 'slETH') {
                const repayAmount = (liquidationAmount.times(10**unhealthyAccount.debt[0].underlying_decimals)).toFixed(0);
                expectedGasAmount = await sashimiLendingLiquidation.methods.liquidateBorrow(unhealthyAccount.debt[0].address, unhealthyAccount.address, repayAmount, unhealthyAccount.collateral[0].address).estimateGas({from: info.addresses.liquidator ,gas: 1000000, value: repayAmount});
                console.log(expectedGasAmount);
                console.log('slETH');
            } else {
                const repayAmount = (liquidationAmount.times(10**unhealthyAccount.debt[0].underlying_decimals)).toFixed(0);
                const ethAmount = unhealthyAccount.debt[0].underlying_price.times(liquidationAmount).times(10**18).times(1.2).div(new BigNumber(ethPrice.toString()));
                expectedGasAmount = await sashimiLendingLiquidation.methods.liquidateBorrow(unhealthyAccount.debt[0].address, unhealthyAccount.address, repayAmount, unhealthyAccount.collateral[0].address).estimateGas({from: info.addresses.liquidator ,gas: 1000000, value: (ethAmount.times(10**18)).toFixed(0)});
                console.log(expectedGasAmount);
                console.log(unhealthyAccount.debt[0].symbol);
            }
            const expectedGasFee = web3.utils.fromWei(gasPrice.mul(web3.utils.toBN(expectedGasAmount)).mul(ethPrice).div(web3.utils.toBN(10**18)));
            console.log(expectedGasFee);
            const expectedRevenue = expectedCollateral.minus(liquidationAmount.times(unhealthyAccount.debt[0].underlying_price));
            console.log(expectedRevenue.toString());
            const expectedProfit = expectedRevenue.minus(expectedGasFee);
            console.log(expectedProfit.toString());
            if(expectedProfit.lte(0)) continue;
            if (unhealthyAccount.debt[0].symbol === 'slETH') {
                const repayAmount = (liquidationAmount.times(10**unhealthyAccount.debt[0].underlying_decimals)).toFixed(0);
                await sashimiLendingLiquidation.methods.liquidateBorrow(unhealthyAccount.debt[0].address, unhealthyAccount.address, repayAmount, unhealthyAccount.collateral[0].address).send({from: info.addresses.liquidator , gasPrice: gasPrice.toNumber(), gas: 2000000, value: repayAmount});
            } else {
                const repayAmount = (liquidationAmount.times(10**unhealthyAccount.debt[0].underlying_decimals)).toFixed(0);
                const ethAmount = unhealthyAccount.debt[0].underlying_price.times(liquidationAmount).times(10**18).times(2).div(new BigNumber(ethPrice.toString()));
                await sashimiLendingLiquidation.methods.liquidateBorrow(unhealthyAccount.debt[0].address, unhealthyAccount.address, repayAmount, unhealthyAccount.collateral[0].address).send({from: info.addresses.liquidator , gasPrice: gasPrice.toNumber(), gas: 2000000, value: (ethAmount.times(10**18)).toFixed(0)});
            }
        }
    }
    catch (e) {
        // This is where you run code if the server returns any errors
        console.log(e);
    }
    
    console.log('End.');
}

var j = schedule.scheduleJob('*/5 * * * *', function(fireDate){
    console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
    (async () => {  
      try {
        await main();
      } catch (e) {
        console.log(e);
      }
    })();
});