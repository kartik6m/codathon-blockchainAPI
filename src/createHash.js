const SHA256 = require("crypto-js/sha256");

hash = (data) => {
    hashInput='';
    hashInput = data.index.toString() + data.timestamp.toString() + data.prevHash.toString() + data.nonce.toString() + JSON.stringify(data.votes);
    return SHA256(hashInput).toString();
}

module.exports = hash;