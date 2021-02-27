const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const CandidateSchema = new Schema({
  candidate: {
    type: String,
    required: true
  },
  team: {
    type: String,
    required: true
  }
});

module.exports = Candidate = mongoose.model("candidates", CandidateSchema);
