const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema for the user data
const UserSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: 'def'
    },
    password: {
        type: String,
        required: true
    },
    voted: {
        type: Boolean,
        required: true,
        default: false
    }
});

module.exports = User = mongoose.model("users", UserSchema);
