const info = require('./info.json');
const Web3 = require('web3');

function useKovanProvider() {
    console.log('using kovan provider..');
    return new Web3(info.kovan);
}

function useMainnetProvider() {
    console.log('using mainnet provider..');
    return new Web3(info.mainnet);
}

module.exports ={
    mainnet : info.mainnet,
    kovan : info.kovan,
    useKovanProvider : useKovanProvider,
    useMainnetProvider : useMainnetProvider
}