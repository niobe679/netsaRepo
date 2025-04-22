const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
//const express = require('express');
const router = express.Router();
const app = express();
const requireAuth = require('../middlewares/auth');
const { registerUser,verifyAccount, loginUser, logoutUser, test, refresh_token } = require("../controllers/authcontroller");
const validateRegistration = require("../middlewares/validateregistration");
const {authenticateToken, authenticateRefreshToken} = require("../middlewares/authenticatetoken");
const passport = require("passport");
const _passport = require("../middlewares/passport");

// Initialize Passport
app.use(passport.initialize());
// Register Route
router.post('/main/register', validateRegistration, registerUser);
// User Login
router.post("/main/login", loginUser);
//user logout
router.post("/main/logout", authenticateToken, logoutUser);
// access with token
router.get("/main/test", authenticateToken, test);
router.get("/main/fest", authenticateRefreshToken);
// refresh token
router.post("/main/refresh", refresh_token);
// Google Auth Route
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Auth Callback
router.get(
    "/google/callback",
    passport.authenticate("google", { session: false }),
    (req, res) => {
        // Redirect to frontend with token
        const token = req.user.token;
        res.redirect(`https://netsahomez.up.railway.app/auth-success?token=${token}`);
    }
);

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

router.get("/verify/:token", verifyAccount);

router.post('/llogout', (req, res) => {
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

router.get('/about', requireAuth, (req, res) => {
    res.status(200).send(`Welcome, ${req.session.user.username}`);
});

module.exports = router;