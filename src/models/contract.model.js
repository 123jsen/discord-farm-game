const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const ContractSchema = Schema({
    contractId: { type: Number, required: true, unique: true },
    userId: { type: String, required: true },
    price: { type: Number, required: true },
    resourceType: { type: String, required: true },
    contractSize: { type: Number, required: true }
});

module.exports = mongoose.model("Contract", ContractSchema);