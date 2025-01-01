const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
//const express = require('express');
const router = express.Router();
const app = express();
const requireAuth = require('../middlewares/auth');

router.get('/about', requireAuth, (req, res) => {
    res.status(200).send(`Welcome, ${req.session.user.username}`);
});

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
        res.status(444).send("not registered");
    }
});

// Login Route
router.post('/login', async (req, res) => {
    console.log("hitt");
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    console.log("user: "+ user);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send("Invalid credentials");
    }
    else{
        console.log("user logged in");

    // Save user info to session
    req.session.user = { id: user._id, username: user.username };
    console.log(req.session.user);
        res.status(201).send("User logged in");
    }
    //const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    //res.json({ token });
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Unable to log out");
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.status(200).send("Logout successful");
    });
});

app.get('/set-session', (req, res) => {
    req.session.user = { 
        name: 'John Doe',
        role: 'admin',
    };
    res.send('Session has been set!');
});

app.get('/get-session', (req, res) => {
    if (req.session.user) {
        res.send(`Hello, ${req.session.user.name}. Your role is ${req.session.user.role}.`);
    } else {
        res.send('No session found.');
    }
});

app.get('/destroy-session', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to destroy session.');
        }
        res.send('Session destroyed.');
    });
});

module.exports = router;