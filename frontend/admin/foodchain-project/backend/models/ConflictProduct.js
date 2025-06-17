const mongoose = require('mongoose');

const ConflictProductSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
    },
    gmail1: { // Already stored Gmail
        type: String,
        required: true,
    },
    gmail2: { // New Gmail that caused the conflict
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const ConflictProduct = mongoose.model('ConflictProduct', ConflictProductSchema);

module.exports = ConflictProduct;