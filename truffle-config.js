const HDWalletProvider = require("@truffle/hdwallet-provider");
const keys = require("./keys");
const providers = require('./providers');
const info = require('./info.json');

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
            network_id: 42,
            gas: 10000000,
            gasPrice : 10000000000, //10 GWei
            networkCheckTimeout: 10000000
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
            network_id: 1,
            gas: 1000000,
            gasPrice : 70000000000, //70 GWei
            networkCheckTimeout: 10000000
        }
    },
    mocha: {
        enableTimeouts: false
    },
    compilers: {
        solc: {
            version: "0.5.16"
        }
    },
    plugins: [
        'truffle-plugin-verify'
    ],

    api_keys: {
        etherscan: info.api_etherscan
    }
};