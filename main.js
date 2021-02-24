let database = require("./src/database");
let blockChainModel = require('./src/database/block-model')

//Set the callback function as the specified one
database.onConnect(async () => {

    let BlockChain = require("./src/blockChain");

    //Instantiate the blockchain, and initialize the chain by reading the current contents from the database
    let blockChain = new BlockChain(await blockChainModel.find({}));

    //Add votes to buffer and create new block to store the votes
    blockChain.addNewVote("candidate1", "party1");
    blockChain.addNewVote("candidate2", "party2");
    blockChain.addNewBlock(blockChain.lastBlock() ? blockChain.lastBlock().hash : null);

    console.log("Chain : ", blockChain.chain);
})