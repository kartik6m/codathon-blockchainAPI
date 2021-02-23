let hash = require('object-hash');

const difficulty = 3;

//check if the block satisfies the hash puzzle
module.exports.validProof = (block) => {
    let guessHash = hash(block);
    // console.log("Hashing: ", guessHash);
    return guessHash.toString().substring(0,difficulty) === Array(difficulty+1).join('0')
}

//Calculate the proof of work for the block. (mine the block)
module.exports.proofOfWork = (block) => {
    // let proof = 0;
    while (true) {
        if (!module.exports.validProof(block)) {
            block.nonce++;
        } else {
            break;
        }
    }
    return hash(block);
}