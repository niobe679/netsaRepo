const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const PORT = process.env.PORT || 5000;
dotenv.config();
const app = express();
app.use(express.json());

// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }).then(() => console.log("MongoDB connected"))
//   .catch((err) => console.log("MongoDB connection error: ", err));

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the directory for the views
app.set('views', path.join(__dirname, '..', 'views')); // This points to the views folder at the root

// Serve static files (like CSS/JS) from the public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Example routes to render EJS views
app.get('/', (req, res) => {
    res.render('index', { title: 'Home Page', message: 'Welcome to my app!' });
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'About Us', message: 'Learn more about us here.' });
});

app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact', message: 'Reach out to us!' });
});


// app.get('/', (req, res) => {
//     res.send('Server is running!');
//   });
  
  app.listen(PORT, () => {
    console.log(`Server is omg listening on port ${PORT}`);
  });