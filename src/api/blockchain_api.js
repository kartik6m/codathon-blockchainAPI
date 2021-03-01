const express = require('express')
const app=express()
let database = require('./../database')
let blockChainModel = require('../database/block-model')
let NodeModel = require('../database/networkNode-model')
let CandidateModel = require('../database/candidate')
let UserModel = require('../database/user')
const reqPromise = require('request-promise');
const session = require('express-session')
const bodyParser = require('body-parser')

const BlockChain = require('./../blockChain')
const { isValidObjectId } = require('mongoose')

database.onConnect(async ()=>{
    let blockChain = new BlockChain(await blockChainModel.find({},{_id:0,__v:0}),await NodeModel.find({},{_id:0,__v:0}));
    let port = process.argv[2];
    const imgUrl = 'https://news.uchicago.edu/sites/default/files/styles/full_width/public/images/2019-07/Mobile%20voting.jpg?itok=oezMDWp-';
    const templateBegin = '<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1, shrink-to-fit=no\"><meta name=\"theme-color\" content=\"#000000\"><link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css\"><title>Blockchain based voting</title></head><body><div class=\'container\'><div class="jumbotron jumbotron-image" style="background-image: url('+imgUrl+');"><h2>Blockchain based e-Voting System</h2></div>';
    const templateEnd = '<div id=\"root\"></div><script src=\"https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js\"></script><script src=\"https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js\"></script></body></html>';
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(session({
        secret: 'work hard',
        resave: true,
        saveUninitialized: false,
    }));

    app.get('/',(req,res)=>{
        if(req.session)
        {
            // console.log(req.session.userID,req.session.email);
            UserModel.findOne({email:req.session.email}).then(user=>{
                if(user.role === 'admin') {
                    return res.redirect('/admin-dashboard');
                }
                else {
                    return res.redirect('/user-dashboard');
                }
            }).catch(err=>{
                return res.send(templateBegin+'<div><a href=/login class=\'btn btn-primary\' role=\'button\'>Log in</a></div><br></br><div><a href=/register/broadcast class=\'btn btn-success\' role=\'button\'>Register</a></div>'+templateEnd);
            })
        }
        
    });

    app.get('/login',(req,res)=>{
        if(req.session.email) {
            UserModel.findOne({email:req.session.email}).then(user=>{
                if(user){
                    if(user.role==='admin'){
                        return res.redirect('/admin-dashboard');
                    }
                    else{
                        return res.redirect('user-dashboard');
                    }
                }
            }).catch(err=>console.log(err));
        }
        else {
            res.sendFile('D:/siemens/basic_blockchain/template/login.html');
        }
        
    });

    app.post('/login',(req,res)=>{
        UserModel.findOne({email:req.body.email}).then(user=>{
            if(!user){
                return res.status(400).send(templateBegin+'<div>User not found</div><a href=/register/broadcast>Register here</a>'+templateEnd);
                // res.send(templateBegin+'<a href=/register/broadcast>Register here</a>'+templateEnd);
            }
            if(req.body.password===user.password){
                req.session.userID = user._id;
                req.session.email = user.email;
                if(user.role === 'admin') return res.redirect('/admin-dashboard');
                else return res.redirect('/user-dashboard');
            }
            else{
                res.status(400).send(templateBegin+'<div>Password incorrect</div><a href=/login>Retry</a>'+templateEnd);
            }
        })
    });

    app.get('/logout',(req,res)=>{
        if (req.session) {
            // delete session object
            req.session.destroy(function (err) {
                if (err) {
                    return next(err);
                } else {
                return res.redirect('/');
                }
            });
        }
    });

    app.get('/summary',(req,res)=>{
        let code = templateBegin;
        let summary = blockChain.generateSummary();
        console.log(summary);
        code=code+'<h4>Summary for the election:</h4>';
        code=code+'<center><table class="table table-bordered table-hover" style="width:auto"><thead style="background-color:#F0FFF0"><tr><th width=150>Candidate</th><th width=120>Team</th><th width=80>Votes</th></tr></thead><tbody>';
        for(cand in summary){
            code = code + '<tr><td>'+cand+'</td><td>'+summary[cand].team+'</td><td>'+summary[cand].votes+'</td>';
        }
        code=code+'</tbody></table></center>';

        // code=code+'<table class="table table-striped"><thead><tr><th width=500>Team</th><th>Votes</th></tr></thead><tbody>';
        // for(cand in summary.team){
        //     code = code + '<tr><td>'+cand+'</td><td>'+summary.team[cand]+'</td>';
        // }
        // code=code+'</tbody></table>';
        code = code + '<a href=/ ><h4>Home</h4></a>';
        code=code+templateEnd;
        return res.send(code);
    });

    app.get('/chain',(req,res)=>{
        // let code = templateBegin;
        // code=code+'<table class="table table-striped"><thead><tr><th>Index</th><th>Votes</th><th>Previous Hash</th><th>Hash</th></tr></thead><tbody>';
        // blockChain.chain.forEach(block=>{
        //     code = code + '<tr><td>'+block.index+'</td><td>'+block.votes+'</td><td>'+block.prevHash+'</td><td>'+block.hash+'</td></tr>';
        // });
        // code=code+'</tbody></table>';
        // code=code+templateEnd;
        // return res.send(code);
        return res.send(blockChain);
    });

    app.get('/user-dashboard',(req,res)=>{
        if(req.session.email) {
            UserModel.findOne({email:req.session.email}).then(user=>{
                if(user){
                    if(user.role==='admin'){
                        return res.redirect('/admin-dashboard');
                    }
                    else{
                        return res.sendFile('D:/siemens/basic_blockchain/template/index-user.html');
                    }
                }
            }).catch(err=>console.log(err));
        }
        else{
            return res.redirect('/');
        }
    });

    app.get('/admin-dashboard',(req,res)=>{
        console.log(req.session);
        if(req.session.email) {
            UserModel.findOne({email:req.session.email}).then(user=>{
                if(user){
                    if(user.role==='voter'){
                        return res.redirect('/user-dashboard');
                    }
                    else{
                        return res.sendFile('D:/siemens/basic_blockchain/template/index-admin.html');
                    }
                }
            }).catch(err=>console.log(err));
        }
        else{
            console.log('session DNE');
            return res.redirect('/');
        }
        
    });

    app.get('/register/broadcast',(req,res)=>{
        res.sendFile('D:/siemens/basic_blockchain/template/register.html');
    });

    app.post('/register',(req,res)=>{
        let entry = {
            email: req.body.email,
            role: req.body.role,
            password: req.body.password
        };
        let newEntry = new UserModel(entry);
        newEntry.save((err)=>{
            if(err){
                console.log(port+': User not added: '+err);
                return res.send('User not added: '+err);
            }
            console.log(port+': User registered successfully');
            return res.send('User registered successfully');
        });
    });

    app.post('/register/broadcast',(req,res)=>{
        let entry = {
            email: req.body.email,
            role: req.body.role,
            password: req.body.password
        };
        let newEntry = new UserModel(entry);
        newEntry.save((err)=>{
            if(err){
                return console.log('User not added: '+err);
            }
            console.log(port+': User registered successfully');
        });
        const registerNodes = [];
        blockChain.networkNodes.forEach(networkNode => {
            const requestOptions = {
                uri: networkNode.url + '/register',
                method: 'POST',
                body: entry,
                json: true
            }
            registerNodes.push(reqPromise(requestOptions));
        });
    
        Promise.all(registerNodes).then((data)=>{
            req.session.userID = newEntry._id;
            req.session.email = newEntry.email;
            if(newEntry.role === 'admin') return res.redirect('/admin-dashboard');
            else return res.redirect('/user-dashboard');
            // return res.send('<div>User registered successfully</div><a href=\'/\'>Home</a>');
        });
    });

    app.get('/add-candidate/broadcast',(req,res)=>{
        if(req.session.email) {
            UserModel.findOne({email:req.session.email}).then(user=>{
                if(user){
                    if(user.role==='voter'){
                        return res.redirect('/user-dashboard');
                    }
                    else{
                        res.sendFile('D:/siemens/basic_blockchain/template/addCandidate.html');
                    }
                }
            }).catch(err=>console.log(err));
        }
        else{
            return res.redirect('/');
        }
        
    });

    app.post('/add-candidate',(req,res)=>{
        let entry = {
            candidate: req.body.candidate,
            team: req.body.team
        };
        CandidateModel.findOne({$or:[{candidate: req.body.candidate }, {team:req.body.team}]}).then(candidate=>{
            if(candidate){
                return res.json({ name: "This candidate/candidate from this party already added" });
            }
            else {
                let newEntry = new CandidateModel(entry);
                newEntry.save((err)=>{
                    if(err){
                        console.log(port+': Candidate not added: '+err);
                        return res.send('Candidate not added');
                    }
                    console.log(port+': Candidate added successfully');
                    return res.send('Candidate added successfully');
                });
            }
        });
    });

    app.post('/add-candidate/broadcast',(req,res)=>{
        let entry = {
            candidate: req.body.candidate,
            team: req.body.team
        };
        CandidateModel.findOne({candidate:req.body.candidate}).then(candidate=>{
            if(candidate){
                return res.send(templateBegin+'<div><h4>This candidate has already been added.</h4></div><a href=\'/\'><h4>Home</h4></a>'+templateEnd);
            }
            else {
                let newEntry = new CandidateModel(entry);
                newEntry.save((err)=>{
                    if(err){
                        console.log(port+': Candidate not added: '+err);
                        return res.send('Candidate not added');
                    }
                    console.log(port+': Candidate added successfully');
                    return res.send(templateBegin+'<div><h4>Candidate added successfully.</h4></div><a href=\'/\'><h4>Home</h4></a>'+templateEnd);
                });
            }
        });
        const registerNodes = [];
        blockChain.networkNodes.forEach(networkNode => {
            const requestOptions = {
                uri: networkNode.url + '/add-candidate',
                method: 'POST',
                body: entry,
                json: true
            }
            registerNodes.push(reqPromise(requestOptions));
        });
        console.log(port+': before promise.all');
        Promise.all(registerNodes).then((data)=>{
            console.log(port+': candidate broadcasted, '+data);
            return res.send(templateBegin+'<div>Candidate added successfully</div><a href=\'/\'><h4>Home</h4></a>'+templateEnd);
        }).catch(err=>{
            console.log(port+': Candidate not broadcasted - '+err);
            return res.send(templateBegin+'<div>Candidate cannot be added</div><a href=\'/\'><h4>Home</h4></a>'+templateEnd);
        });
    });

    app.get('/add-vote/broadcast',async (req,res)=>{
        let candidates = await CandidateModel.find({},{_id:0,__v:0});
        UserModel.findOne({email:req.session.email}).then(user=>{
            if(user){
                if(user.voted){
                    return res.send(templateBegin+'<div><h4>You have already voted.</h4></div><a href=/><h4>Home</h4></a>'+templateEnd);
                }
                else{
                    let code = templateBegin;
                    code = code + '<div class=\"voting-form\"><form id="vote" action=\"/add-vote/broadcast\" method=\"post\" onSubmit=\"event.preventDefault(); validateMyForm();\"><p><h4>Please cast your vote:</h4></p>';
                    for(let i=0;i<candidates.length;i++){
                        code = code + '<input type=\"radio\" id=\"candidate'+1+'\" name="candidate" value=\"'+candidates[i].candidate+'\"><label for=\"vote\">'+candidates[i].candidate+'</label><br>';
                    }
                    code = code + '<input type="submit" value="Vote">';
                    code = code + '<a href=/ ><h4>Home</h4></a>';
                    code = code + '</form></div><script type=\"text/javascript\">var form = document.getElementById(\'vote\');function validateMyForm(){form.submit()}</script>';
                    code = code + templateEnd;
                    res.send(code);
                }
            }
        })
        
    });

    app.post('/add-vote',(req,res)=>{
        blockChain.addNewVote(req.body.candidate, req.body.team);
        // return res.json('you voted for '+req.body.candidate+', '+req.body.team);
        return res.json(port+': Vote is registered.')
    });

    app.post('/add-vote/broadcast',async (req,res)=>{
        // console.log(req.body);
        let cand = req.body.candidate;
        
        cd = await CandidateModel.findOne({candidate: cand})
        let team = cd.team;
        // console.log(cd);
        const vote = blockChain.addNewVote(cand, team);

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
            reqs = [];
            const requestOptions = {
                uri: blockChain.nodeURL + '/mine',
                method: 'GET',
                json: true
            };
            reqs.push(reqPromise(requestOptions));
            Promise.all(reqs).then(data=>{
                UserModel.updateOne({email:req.session.email},{$set:{voted:true}},err=>{
                    if(err){
                        console.log('Error marking as voted: '+err);
                    }
                });
                return res.send(templateBegin+'<div>Vote registered successfully</div><a href=\'/\'>Home</a>'+templateEnd);
            });
        });
    });

    app.post('/add-block',(req,res)=>{
        const blockIn = req.body.block;
        const lastBlock = blockChain.lastBlock();
        if(blockIn.prevHash===lastBlock.hash && lastBlock.index+1 === blockIn.index)
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
                    message: 'Mined & broadcasted new Block successfully',
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

    app.get('/check-validity',async (req,res)=>{
        let dbChain = await blockChainModel.find({},{_id:0,__v:0});
        blockChain.setChainFromDB(dbChain);
        if(!blockChain.isChainValid()){
            reqs = [];
            const requestOptions = {
                uri: blockChain.nodeURL + '/consensus',
                method: 'GET',
                json: true
            };
            reqs.push(reqPromise(requestOptions));
            Promise.all(reqs).then(data=>{
                return res.json(data);
            });
        }
        else {
            return res.json({
                message: "Chain valid.",
                chain: blockChain.chain
            });
        }
        
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

            if(longestChain && !blockChain.isChainValid(longestChain))
            {
                newChains.forEach(newChain=>{
                    if(newChain.chain.length >= maxLength)
                    {
                        maxLength = newChain.chain.length;
                        longestChain = newChain.chain;
                        curr_votes = newChain.curr_votes;
                    }
                });
            }

            if(!longestChain || (longestChain && !blockChain.isChainValid(longestChain)))
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
                    message: "Chain invalid, Running Consensus...\nChain replaced with the longest chain",
                    chain: longestChain
                });
            }
        })
    });

    app.listen(port, ()=>{
        console.log('Running on port '+port)
    })
})