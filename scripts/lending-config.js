const HDWalletProvider = require("@truffle/hdwallet-provider");
const keys = require("../keys");
const providers = require('../providers');
const info = require('../info.json');

module.exports = {

    networks: {
        development: {
            host: "127.0.0.1",
            network_id: "*",
            port: 7245,
            gas: 4000000,
            gasPrice: 10000000000, // 10 gwei
        },

        kovan: {
            provider: function () {
                return new HDWalletProvider({
                    privateKeys: keys.privateKeys,
                    providerOrUrl: providers.kovan,
                    numberOfAddresses: keys.privateKeys.length,
                    pollingInterval: 60000
                  })
            },
            gas: 10000000,
            api_keys: {
                etherscan: info.api_etherscan
            },
            api:{
                etherscan: "https://api.etherscan.io/api",
                lending: info.lending_api.kovan
            },
            contracts:{
                priceOracle: info.contracts.kovan.priceOracle,
                slETH: info.contracts.kovan.slETH,
                comptroller: info.contracts.kovan.comptroller,
                sashimiLendingLiquidation: info.contracts.kovan.sashimiLendingLiquidation
            },
            lending_parameters: {
                close_factor: 0.5,
                liquidation_incentive: 1.08
            }
        },

        mainnet: {
            provider: function () {
                return new HDWalletProvider({
                    privateKeys: keys.privateKeys,
                    providerOrUrl: providers.mainnet,
                    numberOfAddresses: keys.privateKeys.length,
                    pollingInterval: 60000
                  })
            },
            gas: 1000000,
            api_keys: {
                etherscan: info.api_etherscan
            },
            api:{
                etherscan: "https://api.etherscan.io/api",
                lending: info.lending_api.mainnet
            },
            contracts:{
                priceOracle: info.contracts.mainnet.priceOracle,
                slETH: info.contracts.mainnet.slETH,
                comptroller: info.contracts.mainnet.comptroller,
                sashimiLendingLiquidation: info.contracts.mainnet.sashimiLendingLiquidation
            },
            lending_parameters: {
                close_factor: 0.5,
                liquidation_incentive: 1.08
            }
        }
    }
};