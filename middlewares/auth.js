const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const express = require('express');
const app = express();
// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      callbackURL: "/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      // Here you would handle user creation or lookup in your database
      return done(null, profile);
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google authentication routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signup" }),
  (req, res) => {
    // Successful login
    res.redirect("/");
  }
);

const requireAuth = (req, res, next) => {
  console.log("qq "+req.session.user+" : "+res);
  if (!req.session.user) {
      return res.redirect("/login");//.send("Unauthorized: Please log in");
  }
  next();
};

module.exports = (req, res, next) => {
  if (!req.session.user) {
      return res.status(401).send('Unauthorized: Please log in.');
  }
  if (req.session.user.role !== 'admin') {
      return res.status(403).send('Forbidden: Admin access only.');
  }
  next();
};


module.exports = requireAuth;
