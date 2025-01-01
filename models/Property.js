const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  price: Number,
  rob: String,
  location: String,
  bedrooms: Number,
  squarefeet: Number,
  type: String,
  name: String,
  imageUrl: String // Cloudinary URL
});

const Property = mongoose.model('Property', propertySchema);
module.exports = Property;