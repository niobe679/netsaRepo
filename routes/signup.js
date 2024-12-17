const express = require('express');
const router = express.Router();

// Route to render the Sign Up page
router.get('/', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

// Route to handle the POST request when the sign up form is submitted
router.post('/', (req, res) => {
  const { name, email, password } = req.body;  // Destructure form data from req.body

  // Example of processing the sign-up (you can save data to a database here)
  console.log(`New user signed up: ${name}, Email: ${email}`);

  // After successful sign-up, redirect the user to the home page (or a confirmation page)
  res.redirect('/');  // Or redirect to a login page
});

module.exports = router;