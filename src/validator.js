let hash = require('./createHash');

const difficulty = 3;

//check if the block satisfies the hash puzzle
module.exports.validProof = (block) => {
    let guessHash = hash(block);
    return guessHash.toString().substring(0,difficulty) === Array(difficulty+1).join('0')
}

//Calculate the proof of work for the block.
module.exports.proofOfWork = (block) => {
    while (true) {
        if (!module.exports.validProof(block)) {
            block.nonce++;
        } else {
            break;
        }
    }
    return hash(block);
}