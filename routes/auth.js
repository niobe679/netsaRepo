const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
    console.log(req.body.username);
    try
    {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).send("User registered");
        //res.redirect("/")
    }
    catch(error){
        res.status(444).send("User registered");
    }
});

// Login Route
router.post('/login', async (req, res) => {
    console.log("hitt");
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send("Invalid credentials");
    }
    else{
        console.log("login");
        res.status(201).send("User logged in");
    }
    //const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    //res.json({ token });
});

module.exports = router;