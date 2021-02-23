let mongoose = require("mongoose");
let Schema = mongoose.Schema;

//Create the Schema for a block
let BlockChainSchema = new Schema({
    index: {
        required: true,
        type: Schema.Types.Number
    },
    timestamp: {
        required: true,
        type: Schema.Types.Date,
        default: Date.now()
    },
    votes: {
        required: true,
        type: Schema.Types.Array
    },
    prevHash: {
        required: false,
        type: Schema.Types.String
    },
    nonce: {
        required: true,
        type: Schema.Types.Number
    },
    hash: {
        required: true,
        type: Schema.Types.String
    }
});

module.exports = mongoose.model("vote_blocks", BlockChainSchema);