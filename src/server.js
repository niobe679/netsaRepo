const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000;
dotenv.config();
const app = express();
app.use(express.json());

// Middleware to parse URL-encoded data
app.use(express.urlencoded({ extended: true }));  // For form submissions

// Import routes
const signupRoutes = require(path.join("../routes/signup"));
const loginRoutes = require(path.join("../routes/login"))
const authRoutes = require(path.join('../routes/auth'));
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI_Local, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error: ", err));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the directory for the views
app.set('views', path.join(__dirname, '..', 'views')); // This points to the views folder at the root

// Serve static files (like CSS/JS) from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));
// Mock property data
const properties = [
  { id: 1, name: 'Modern Apartment', location: 'Addis Ababa', price: '$150,000', image: '/images/property2.jpg' },
  { id: 2, name: 'Cozy Villa', location: 'Bishoftu', price: '$220,000', image: '/images/property3.jpg' },
  { id: 3, name: 'Office Space', location: 'Jemo, Addis Ababa', price: '$120,000', image: '/images/property1.jpg' }
];
// Example routes to render EJS views
// app.get('/', (req, res) => {
//     res.render('index', { title: 'Home Page', message: 'Welcome to my app!' });
// });
app.get('/', (req, res) => {
  res.render('dashboard', { title: 'Netsa Homes', properties });
});
app.get('/Home', (req, res) => {
  res.render('dashboard', { title: 'Netsa Homes', properties });
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'About Us', message: 'Learn more about us here.' });
});

app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact', message: 'Reach out to us!' });
});


// Use the routes from the signup.js file
app.use('/signup', signupRoutes);
app.use('/login', loginRoutes);
// app.get('/', (req, res) => {
//     res.send('Server is running!');
//   });
  
  app.listen(PORT, () => {
    console.log(`Server is omg listening on port ${PORT}`);
  });