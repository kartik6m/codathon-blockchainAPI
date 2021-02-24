let mongoose = require("mongoose");
let Schema = mongoose.Schema;

//Create the Schema for a block
let NodeSchema = new Schema({
    url: {
        required: true,
        type: Schema.Types.String
    }
});

module.exports = mongoose.model("networkNodes", NodeSchema);