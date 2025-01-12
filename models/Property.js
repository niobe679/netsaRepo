const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  price: Number,
  rob: String,
  location: String,
  bedrooms: Number,
  squarefeet: Number,
  type: String,
  name: String,
  imageUrl: [
    {
      url: String,
      public_id: String, // This must be stored
    },
  ], // Array of image URLs
});

const Property = mongoose.model('Property', propertySchema);
module.exports = Property;