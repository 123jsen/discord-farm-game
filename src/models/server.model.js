const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ServerSchema = Schema({
    guildId: { type: String, required: true, unique: true }
});

module.exports = mongoose.model("Server", ServerSchema);