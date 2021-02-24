let hash = require('object-hash');
//number of zeros required before hash. More the number, longer it will take to mine the block.
const difficulty = 3;

let validator = require("./validator");

// let mongoose = require("mongoose");

//get the model of the block to save
// let blockChainModel = mongoose.model("vote_blocks");
let blockChainModel = require('./database/block-model')
let NodeModel = require('./database/networkNode-model')


let chalk = require("chalk");

class BlockChain {

    constructor(initialChain=[], initialNetworkNodes=[]) {

        //Set the chain to be in it's previous state
        // this.chain = this.getInitialChain();
        this.chain = initialChain;
        //Buffer to store incoming votes
        this.curr_votes = [];
        this.nodeURL = process.argv[3];
        this.networkNodes = initialNetworkNodes;
        
        if(this.chain.length===0) {
            this.createGenesisBlock();
        }
    }

    // getInitialChain = async ()=>{
    //     let initChain = await blockChainModel.find({index:1});
    //     return initChain;
    // }
    createGenesisBlock() {
        let block = {
            index: 1,
            timestamp: Date.now(),
            votes: [],
            prevHash: 0,
            nonce: 0,
            hash: 'Genesis Block'
        };
        this.saveBlock(block);
    }

    addNewNode(nodeURL) {
        let node = (nodeURL.url?nodeURL:{url:nodeURL})
        // let node = {
            // url: nodeURL
        // };
        if(this.networkNodes.indexOf(node)===-1 && this.nodeURL!==node.url)
        {
            this.networkNodes.push(node);
            let newNode = new NodeModel(node);
            newNode.save((err)=>{
                if(err){
                    return console.log(chalk.red("Cannot add node: "+err.message));
                console.log(chalk.green('Node added successfully'));
                }
            });
            return true;
        } else {
            return false;
        }
    }

    //Function takes the hash of previous block, creates a block with the votes in the buffer,
    //calculates the proof of work, and saves the block on the database.
    addNewBlock(prevHash) {
        let block = {
            index: this.chain.length + 1,
            timestamp: Date.now(),
            votes: this.curr_votes,
            prevHash: prevHash,
            nonce: 0
        };
        //save the block only if it satisfies the hash puzzle
        if (validator.proofOfWork(block).toString().substring(0,difficulty) === Array(difficulty+1).join('0')) {
            block.hash = hash(block);
            //Add it to the instance Save it on the DB Console Success
            this.saveBlock(block);
            return block;
        }
    }

    saveBlock(block) {
        let newBlock = new blockChainModel(block);
            newBlock.save((err) => {
                if (err)
                    return console.log(chalk.red("Cannot save Block to DB ", err.message));
                console.log(chalk.green("Block Saved on the DB"));
            });
            //Add to Chain
            this
                .chain
                .push(block);
            this.curr_votes = [];
            return block;
    }

    //add new vote to the buffer
    addNewVote(candidateIn,partyIn) {
        this
            .curr_votes
            .push({candidate: candidateIn, party: partyIn});
            return {candidate: candidateIn, party: partyIn};
    }

    //get the latest block from chain
    lastBlock() {
        return this
            .chain
            .slice(-1)[0];
    }

    isEmpty() {
        return this.chain.length == 0;
    }

}

module.exports = BlockChain;