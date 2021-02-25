const express = require('express')
const app=express()
let database = require('./../database')
let blockChainModel = require('../database/block-model')
let NodeModel = require('../database/networkNode-model')
const reqPromise = require('request-promise');

const bodyParser = require('body-parser')
app.use(bodyParser.json())

const BlockChain = require('./../blockChain')

database.onConnect(async ()=>{
    let blockChain = new BlockChain(await blockChainModel.find({},{_id:0,__v:0}),await NodeModel.find({},{_id:0,__v:0}));
    let port = process.argv[2];
    // console.log("Chain : ", blockChain.chain);

    app.get('/chain',(req,res)=>{
        return res.send(blockChain);
    });

    app.post('/add-vote',(req,res)=>{
        blockChain.addNewVote(req.body.candidate, req.body.party);
        return res.json('you voted for '+req.body.candidate+', '+req.body.party);
        // res.json('Vote will be registered.')
    });

    app.post('/add-vote/broadcast',(req,res)=>{
        const vote = blockChain.addNewVote(req.body.candidate, req.body.party);
        // res.json('you voted for '+req.body.candidate+', '+req.body.party);

        const registerNodes = [];
        blockChain.networkNodes.forEach(networkNode => {
            const requestOptions = {
                uri: networkNode.url + '/add-vote',
                method: 'POST',
                body: vote,
                json: true
            }
            registerNodes.push(reqPromise(requestOptions));
        });
    
        Promise.all(registerNodes).then((data)=>{
            return res.json({message: "vote registered and broadcasted."});
        });
    });

    app.post('/add-block',(req,res)=>{
        const blockIn = req.body.block;
        const lastBlock = blockChain.lastBlock();
        if(/*lastBlock==null || */(blockIn.prevHash===lastBlock.hash /*&& lastBlock.index+1 === blockIn.index*/))
        {
            blockChain.saveBlock(blockIn);
            return res.json(
                {
                    message: 'Add new Block successfully!',
                    newBlock: blockIn
                }
            );
        } else {
            return res.json(
                {
                    message: 'Cannot add new Block!',
                    newBlock: blockIn
                }
            );
        }
    });

    app.get('/mine',(req,res)=>{
        let addedBlock = blockChain.addNewBlock(blockChain.lastBlock().hash);
        // res.json(addedBlock);
    
        const requests = [];
        blockChain.networkNodes.forEach(networkNode => {
            const requestOptions = {
                uri: networkNode.url + '/add-block',
                method: 'POST',
                body: {block : addedBlock},
                json: true
            }
            requests.push(reqPromise(requestOptions));
        });
    
        Promise.all(requests).then(data => {
            return res.json(
                {
                    message: 'Mining & broadcasting new Block successfully',
                    newBlock: addedBlock
                }
            );
            
        }).catch(err=>{
            console.log('error in broadcast: '+err);
        });
    });

    app.post('/register-node',(req,res)=>{
        if(blockChain.addNewNode(req.body.nodeURL))
        {
            return res.json('Node registered successfully');
        } else {
            return res.json('Cannot be registered because already present');
        }
    });

    app.post('/register-bulk-nodes',(req,res)=>{
        req.body.networkNodes.forEach((nodeURL)=>{
            blockChain.addNewNode(nodeURL);
        });
        return res.json('Nodes registered successfully');
    });

    app.post('/register-and-broadcast-node', (req, res)=>{
        const nodeURL = req.body.nodeURL;
    
        blockChain.addNewNode(nodeURL);
    
        const registerNodes = [];
        blockChain.networkNodes.forEach(networkNode => {
            const requestOptions = {
                uri: networkNode.url + '/register-node',
                method: 'POST',
                body: { nodeURL: nodeURL },
                json: true
            }
            registerNodes.push(reqPromise(requestOptions));
        });
    
        Promise.all(registerNodes)
            .then(data => {
                const bulkRegisterOptions = {
                    uri: nodeURL + '/register-bulk-nodes',
                    method: 'POST',
                    body: { networkNodes: [...blockChain.networkNodes, blockChain.nodeURL] },
                    json: true
                }
    
                return reqPromise(bulkRegisterOptions);
            }).then(data => {
                return res.json(
                    {
                        message: 'A node registered with network successfully'
                    }
                );
            });
    });

    app.get('/nodes', (req,res)=>{
        return res.json({nodeURL: blockChain.nodeURL, networkNodes: blockChain.networkNodes});
    });

    app.get('/consensus',(req,res)=>{
        const requests = [];
        blockChain.networkNodes.forEach(nodeURL=>{
            const requestOptions = {
                uri : nodeURL.url + '/chain',
                method: 'GET',
                json: true
            };
            requests.push(reqPromise(requestOptions));
        });
        Promise.all(requests).then(newChains=>{
            const currentLength = blockChain.chain.length;
            let maxLength = currentLength;
            let longestChain = blockChain.chain;
            let curr_votes = null;

            newChains.forEach(newChain=>{
                if(newChain.chain.length > maxLength)
                {
                    maxLength = newChain.chain.length;
                    longestChain = newChain.chain;
                    curr_votes = newChain.curr_votes;
                }
            });

            if(!longestChain ||(longestChain && !blockChain.isChainValid(longestChain)))
            {
                return res.json({
                    message: "Chain cannot be replaced: "+blockChain.isChainValid(longestChain),
                    chain: blockChain.chain
                });
            }
            else if(longestChain && blockChain.isChainValid(longestChain))
            {
                blockChain.replaceWithLongestChain(longestChain);
                blockChain.curr_votes = curr_votes;
                return res.json({
                    message: "Chain updated",
                    chain: longestChain
                });
            }
        })
    });

    app.listen(port, ()=>{
        console.log('Running on port '+port)
    })
})