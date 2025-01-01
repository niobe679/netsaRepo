const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const express = require('express');
const app = express();
const router = express.Router();
const Property = require('../models/Property');
// Multer setup for handling file uploads
const multer = require('multer');

const upload = multer({ dest: 'uploads/' }); // Temporary storage
router.post('/search', async (req, res) => {
  console.log('Req:', req.body); // Debugging log
  const { price, rob, location, bedrooms, squarefeet, type } = req.body;
    // const query = req.query.q || '';
    // const filter = req.query.filter || '';
    // const _price = req.body.price || '';// document.getElementById('price').value;
    // const _rob = req.body.rob || '';//document.getElementById('rob').value;
    // const _location = req.body.location || '';//document.getElementById('location').value;
    // const _bedrooms = req.body.bedrooms || '';//document.getElementById('bedrooms').value;
    // const _squarefeet = req.body.squarefeet || '';//document.getElementById('squarefeet').value;
    // const _type = req.body.type || '';//document.getElementById('propertType').value;

    try {
      // Construct the filters dynamically
      const filters = {};
      if (price) filters.price = { $lte: parseInt(price) };
      if (rob) filters.rob = { $regex: rob, $options: 'i' };;
      if (location) filters.location = { $regex: location, $options: 'i' }; // Case-insensitive search
      if (bedrooms) filters.bedrooms = parseInt(bedrooms);
      if (squarefeet) filters.squarefeet = { $lte: parseInt(squarefeet) };
      if (type) filters.type = type;
  
      // Filter the properties based on the query and filter
      console.log('Filters:', filters); // Debugging log
      const results = await Property.find(filters);
      res.json({ results });
      // const _results = properties.filter(property => 
      //   property.name.toLowerCase().includes(query.toLowerCase()) &&
      //   (!filter || property.category === filter)
      // );
  
      //res.json({ results }); // Send the results as JSON
    } catch (error) {
      console.error('Error fetching search results:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});
  
  router.post('/add-property', upload.single('image'), async (req, res) => {
    console.log('Request Body:', req.body);
    try {
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);
  
      // Save property data with image URL in MongoDB
      const newProperty = new Property({
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        price: req.body.price,
        rob: req.body.rob,
        location: req.body.location,
        bedrooms: req.body.bedrooms,
        squarefeet: req.body.squarefeet,
        type: req.body.type,
        imageUrl: result.secure_url // Cloudinary URL
      });
  
      await newProperty.save();
      res.json({ message: 'Property added successfully!', property: newProperty });
    } catch (error) {
      console.error('Error uploading property:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.get('/properties', async (req, res) => {
    try {
      const properties = await Property.find(); // Fetch all properties
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  router.get('/', (req, res) => {
  res.render('Properties', { title: 'Properties' });
  
});
router.get('/add-property', (req, res) => {
  res.render('AddProperties', { title: 'Properties' });
  
});
  module.exports = router;