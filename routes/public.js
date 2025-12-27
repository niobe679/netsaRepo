const express = require('express');
const router = express.Router();
const path = require('path');
const { cloudinary, upload } = require(path.join('../utils/config/cloudinary')); // Import from config
const { getPublicProperties, getFeaturedProperty, getPropertyOwner } = require("../controllers/propertycontroller");
const {authenticateToken, authenticateRefreshToken} = require("../middlewares/authenticatetoken");
const Property = require('../models/Property');
//properties
// Get all properties
router.get('/main/properties', getPublicProperties);
router.get('/main/properties/featured', getFeaturedProperty);
router.get('/main/featured', getFeaturedProperty);
router.get('/main/property/owner/:id', getPropertyOwner);
router.post('/main/search',async (req, res) => 
    {
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
        if (rob) filters.rob = parseInt(rob);
        if (location) filters.location = { $regex: location, $options: 'i' }; // Case-insensitive search
        if (bedrooms) filters.bedrooms = parseInt(bedrooms);
        if (squarefeet) filters.squarefeet = { $lte: parseInt(squarefeet) };
        if (type) filters.type = type;
    
        // Filter the properties based on the query and filter
        console.log('Filters:', filters); // Debugging log
        const results = await Property.find(filters);
        res.json(results);
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

module.exports = router;