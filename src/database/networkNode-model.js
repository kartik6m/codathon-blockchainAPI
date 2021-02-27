let mongoose = require("mongoose");
let Schema = mongoose.Schema;

//Create the Schema for address of node in the network
let NodeSchema = new Schema({
    url: {
        required: true,
        type: Schema.Types.String
    }
});

module.exports = mongoose.model("networkNodes", NodeSchema);