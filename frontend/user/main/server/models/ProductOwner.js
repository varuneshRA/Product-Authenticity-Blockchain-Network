const mongoose = require('mongoose');

const productOwnerSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true // Ensure only one record per productId
  },
  gmail: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
});

const ProductOwner = mongoose.model('ProductOwner', productOwnerSchema);

module.exports = ProductOwner;