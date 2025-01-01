const express = require('express');
const isAdmin = require('../middlewares/isAdmin');
const router = express.Router();
const Property = require('../models/Property');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const User = require('../models/User');
const { cloudinary, upload } = require(path.join('../utils/config/cloudinary')); // Import from config
//const express = require('express');
const app = express();
const requireAuth = require('../middlewares/auth');
const multer = require('multer');

//const upload = multer({ dest: 'uploads/' }); // Temporary storage
// Admin Login Page
router.get('/login', (req, res) => {
    res.render('admin/login', { error: null });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || user.role !== 'admin' || !(await bcrypt.compare(password, user.password))) {
        console.log("invalid");
        return res.redirect('/admin/login?error=Invalid credentials.');
    }
    else{
        console.log("valid");
    // Admin authenticated
    req.session.user = { id: user._id, role: 'admin' };
    res.status(201).send("admin logged in");
    }
});

// Admin dashboard
router.get('/dashboard', isAdmin, (req, res) => {
    res.render('admin/dashboard', { user: req.session.user });
});

// // Manage users
// router.get('/users', isAdmin, async (req, res) => {
//     const users = await User.find({});
//     res.render('admin/users', { user: req.session.user, users });
// });

// Property Management
router.get('/properties', isAdmin, async (req, res) => {
    const properties = await Property.find();
    res.render('admin/properties', { properties });
});

router.get('/addproperties', isAdmin, (req, res) => {
    res.render('admin/addproperties');
});

router.post('/addproperties', isAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No image uploaded');
        }
        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path);
        //Ensure the Cloudinary upload was successful and the URL is available
        if (!result || !result.secure_url) {
            return res.status(500).send('Error uploading image to Cloudinary');
        }
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
        res.redirect('properties')
        //res.json({ message: 'Property added successfully!', property: newProperty });
      } catch (error) {
        console.error('Error uploading property:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
});

router.get('/properties/edit/:id', isAdmin, async (req, res) => {
    const property = await Property.findById(req.params.id);
    res.render('admin/editProperty', { property });
});

router.post('/properties/edit/:id', isAdmin, async (req, res) => {
    const { name, location, price } = req.body;
    await Property.findByIdAndUpdate(req.params.id, { name, location, price });
    res.redirect('admin/properties');
});

router.post('/properties/delete/:id', isAdmin, async (req, res) => {
    await Property.findByIdAndDelete(req.params.id);
    res.redirect('admin/properties');
});

router.post('/search',isAdmin, async (req, res) => 
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
    


// User Management
router.get('/users', isAdmin, async (req, res) => {
    const users = await User.find();
    res.render('admin/users', { users });
});

router.get('/users/add', isAdmin, (req, res) => {
    res.render('admin/addUser');
});

router.post('/users/add', isAdmin, async (req, res) => {
    const { username, email, role } = req.body;
    await User.create({ username, email, role });
    res.redirect('admin/users');
});

router.get('/users/edit/:id', isAdmin, async (req, res) => {
    const user = await User.findById(req.params.id);
    res.render('admin/editUser', { user });
});

router.post('/users/edit/:id', isAdmin, async (req, res) => {
    const { username, email, role } = req.body;
    await User.findByIdAndUpdate(req.params.id, { username, email, role });
    res.redirect('admin/users');
});

router.post('/users/delete/:id', isAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('admin/users');
});

// Example: Add other admin functionalities here
// router.post('/some-action', isAdmin, (req, res) => { ... });

module.exports = router;
