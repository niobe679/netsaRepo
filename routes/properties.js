const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Property = require('../models/Property');
const mongoose = require('mongoose');
const { authenticateToken } = require("../middlewares/authenticatetoken");
const { getPropertyOwner, getPropertyById } = require("../controllers/propertycontroller");
// Multer setup for handling file uploads
const multer = require('multer');

const upload = multer({ dest: 'uploads/' }); // Temporary storage

router.post('/pagesearch', async (req, res) => {
  console.log('Req Post:', req.body); // Debugging log
  const { price, rob, location, bedrooms, squarefeet, type, isFilter, searchAll } = req.body;
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
    if (isFilter == true) {
      if (price) filters.price = { $lte: parseInt(price) };
      if (rob) filters.rob = { $regex: rob, $options: 'i' };;
      if (location) filters.location = { $regex: location, $options: 'i' }; // Case-insensitive search
      if (bedrooms) filters.bedrooms = parseInt(bedrooms);
      if (squarefeet) filters.squarefeet = { $lte: parseInt(squarefeet) };
      if (type) filters.type = type;


      // Filter the properties based on the query and filter
      console.log('Filters:', filters); // Debugging log
      const results = await Property.find(filters).sort({ createdAt: -1 });
      res.status(201).json({ results });
    }
    else {
      console.log('in else ' + searchAll); // Debugging log

      if (searchAll) {
        results = Object;

        if (isNumeric(searchAll)) {
          filters.price = { $lte: parseInt(searchAll) };
          results = await Property.find(filters);
          console.log('price'); // Debugging log
        }
        else {
          console.log('not price'); // Debugging log

          filters.name = { $regex: searchAll, $options: 'i' };
          results = await Property.find(filters);
          if (!results) {

            filters.location = { $regex: searchAll, $options: 'i' };
            results = await Property.find(filters);
            if (!results) {
              filters.type = { $regex: searchAll, $options: 'i' };
              results = await Property.find(filters);
              if (!results) {
                console.log("Nada");
                res.status(200).json({ error: 'No results' });
              }
            }



          }



        }
        console.log('res: ' + results); // Debugging log

        res.status(201).json({ results });
      }
      else
        res.status(400).json({ error: 'unknown key word' });
    }

    // Filter the properties based on the query and filter
    //console.log('Filters:', filters); // Debugging log
    //const results = await Property.find(filters);
    //res.render('searchResult',{properties});

    //res.json({ results });
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
router.get('/owner/:id', getPropertyOwner);
router.get('/search', async (req, res) => {
  console.log('Req:', req.body); // Debugging log
  const { price, rob, location, bedrooms, squarefeet, type, isFilter, searchAll } = req.query;
  // const query = req.query.q || '';
  // const filter = req.query.filter || '';
  // const _price = req.body.price || '';// document.getElementById('price').value;
  // const _rob = req.body.rob || '';//document.getElementById('rob').value;
  // const _location = req.body.location || '';//document.getElementById('location').value;
  // const _bedrooms = req.body.bedrooms || '';//document.getElementById('bedrooms').value;
  // const _squarefeet = req.body.squarefeet || '';//document.getElementById('squarefeet').value;
  // const _type = req.body.type || '';//document.getElementById('propertType').value;
  console.log(isFilter);
  try {
    // Construct the filters dynamically
    const filters = {};
    if (isFilter == "true") {
      if (price) filters.price = { $lte: parseInt(price) };
      if (rob) filters.rob = { $regex: rob, $options: 'i' };
      if (location) filters.location = { $regex: location, $options: 'i' }; // Case-insensitive search
      if (bedrooms) filters.bedrooms = parseInt(bedrooms);
      if (squarefeet) filters.squarefeet = { $lte: parseInt(squarefeet) };
      if (type) filters.type = type;


      // Filter the properties based on the query and filter
      console.log('Filters:', filters); // Debugging log
      const properties = await Property.find(filters).sort({ createdAt: -1 });
      res.render('searchResult', { properties });
    }
    else {
      console.log('in else ' + searchAll); // Debugging log

      if (searchAll) {
        properties = Object;

        if (isNumeric(searchAll)) {
          filters.price = { $lte: parseInt(searchAll) };
          properties = await Property.find(filters);
          console.log('price'); // Debugging log
        }
        else {
          console.log('not price'); // Debugging log

          filters.name = { $regex: searchAll, $options: 'i' };
          properties = await Property.find(filters);
          if (!properties) {

            filters.location = { $regex: searchAll, $options: 'i' };
            properties = await Property.find(filters);
            if (!properties) {
              filters.type = { $regex: searchAll, $options: 'i' };
              properties = await Property.find(filters);
              if (!properties) {
                console.log("Nada");
              }
            }



          }



        }
        console.log('res: ' + properties); // Debugging log

        res.render('searchResult', { properties });
      }
    }
    //res.json({ properties });
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

router.post('/add-property', authenticateToken, upload.single('image'), async (req, res) => {
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
      imageUrl: result.secure_url, // Cloudinary URL
      createdBy: req.user.id
    });

    await newProperty.save();
    res.json({ message: 'Property added successfully!', property: newProperty });
  } catch (error) {
    console.error('Error uploading property:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const properties = await Property.find().sort({ createdAt: -1 }); // Fetch all properties, newest first
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const properties = await Property.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (error) {
    console.error('Error fetching my listings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/data/:id', async (req, res) => {
  const { id } = req.params;
  console.log("p " + id)
  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid property ID' });
  }

  try {
    const property = await Property.findById(id); // Fetch property by ID
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (property.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to edit this property' });
    }

    const updatedProperty = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (property.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this property' });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id/attach-virtual-tour', authenticateToken, async (req, res) => {
  try {
    const { virtualTourId } = req.body;
    const property = await Property.findById(req.params.id);

    if (!property) return res.status(404).json({ error: 'Property not found' });

    if (property.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to edit this property' });
    }

    property.virtualTourId = virtualTourId;
    await property.save();

    res.json(property);
  } catch (error) {
    console.error('Error attaching virtual tour:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/rentals', async (req, res) => {
  try {
    const filters = {};
    filters.rob = { $regex: 'rent', $options: 'i' };
    const properties = await Property.find(filters).sort({ createdAt: -1 }); // Fetch all properties, newest first
    res.render('rentals', { properties });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/home', async (req, res) => {
  console.log("home req")
  try {
    const properties = await Property.find().sort({ createdAt: -1 }); // Fetch all properties, newest first
    res.render('properties', { properties });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/mobile/home', async (req, res) => {
  console.log("home req");
  try {
    const properties = await Property.find().sort({ createdAt: -1 }); // Fetch all properties, newest first
    res.json({ properties }); // Send properties as JSON
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/add-property', (req, res) => {
  res.render('AddProperties', { title: 'Properties' });

});

function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

function handleSearch(key) {
  if (isNumeric(key)) {
    console.log(`Searching by price: ${key}`);
    // Perform numeric-based search logic
  } else {
    console.log(`Searching by string: "${key}"`);
    // Perform string-based search logic
  }
}

router.get('/:id', getPropertyById);

module.exports = router;