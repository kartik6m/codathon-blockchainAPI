let mongoose = require("mongoose");

let BlockChainModel = require("./model");

//Connect to database
mongoose.connect("mongodb://localhost:27017/voting_data", {useNewUrlParser:true}, (err) => {
    if (err)
        return console.log("Cannot connect to DB");
    console.log("Database is Connected");
    connectionCallback();
});
//declare connectionCallback as empty function. Function to be used will be passed in main.js
let connectionCallback = () => {};

//when the database connects, set the connectionCallback function as the function which is passed
module.exports.onConnect = (callback) => {
    connectionCallback = callback;
}