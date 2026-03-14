const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  price: Number,
  rob: String,
  location: String,
  bedrooms: Number,
  bathrooms: Number,
  squarefeet: Number,
  lotSize: Number,
  latitude: Number,
  longitude: Number,
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
  virtualTourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualTour',
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

const Property = mongoose.model('Property', propertySchema);
module.exports = Property;