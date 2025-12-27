const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  price: Number,
  rob: String,
  location: String,
  bedrooms: Number,
  squarefeet: Number,
  type: String,  
  name: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  imageUrl: [
    {
      url: String,
      public_id: String, // This must be stored
      order: Number,
    },
  ], // Array of image URLs
});

const Property = mongoose.model('Property', propertySchema);
module.exports = Property;