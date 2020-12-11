const info = require('./info.json');

module.exports = {
    address: {
        alice: info.addresses.alice,
        jack: info.addresses.jack,
        lisa: info.addresses.lisa,
        bob: info.addresses.bob,
    },
    privateKeys: info.keys
}