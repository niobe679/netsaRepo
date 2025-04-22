const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Adjust path based on your project
require("dotenv").config();

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/auth/google/callback",
            passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // Create a new user if not found
                    user = new User({
                        googleId: profile.id,
                        full_name: profile.displayName,
                        email: profile.emails[0].value,
                        profileImage: profile.photos[0].value,
                    });
                    await user.save();
                }

                // Generate JWT token
                const token = jwt.sign(
                    { id: user._id, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                return done(null, { user, token });
            } catch (err) {
                return done(err, null);
            }
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