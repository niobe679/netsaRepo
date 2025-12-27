const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const emailService = require("../utils/emailservice");
const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtutils');

const registerUser = async ({ username, full_name, email, password, phone_number, role, req }) => {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error("Email is already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user
    const user = new User({
        username,
        full_name,
        email,
        password_hash: hashedPassword,
        phone_number,
        role: role || 'user',
        is_verified: true,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
    });
    await user.save();

    // Auto-login after registration
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await Session.create({
        user_id: user._id,
        refresh_token: refreshToken,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    return { user, accessToken, refreshToken };
};

const verifyAccount = async (token) => {
    // Find verification token
    const tokenRecord = await VerificationToken.findOne({ token });
    if (!tokenRecord) {
        throw new Error("Invalid or expired verification token.");
    }

    // Activate user account
    const user = await User.findById(tokenRecord.user_id);
    if (!user) {
        throw new Error("User not found.");
    }

    user.is_verified = true;
    user.is_active = true;
    await user.save();

    // Remove token after successful verification
    await VerificationToken.deleteOne({ token });

    return "Account verified successfully.";
};
const loginAdmin = async ({ email, password, req }) => {
    // Check if user exists
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    // Check if user is active
    if (!user.is_active) {
        throw new Error("Your account is deactivated. Contact support.");
    }

    if (user.role !== 'admin') {
        throw new Error('Forbidden: Admin access only.');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    // const token = jwt.sign(
    //     { userId: user._id, email: user.email, role: user.role },
    //     process.env.JWT_SECRET,
    //     { expiresIn: "7d" } // Token valid for 7 days but 1h
    // );
    //console.log("check 3 ");
    // Store session in DB
    await Session.create({
        user_id: user._id,
        refresh_token: refreshToken,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });
    //console.log("check 4");
    return { user, accessToken, refreshToken };
};
const loginUser = async ({ email, password, req }) => {
    // Check if user exists
    const user = await User.findOne({ email });
    //console.log(user);
    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error("Invalid email or password");
    }

    // Check if user is active
    if (!user.is_active) {
        throw new Error("Your account is deactivated. Contact support.");
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    // const token = jwt.sign(
    //     { userId: user._id, email: user.email, role: user.role },
    //     process.env.JWT_SECRET,
    //     { expiresIn: "7d" } // Token valid for 7 days but 1h
    // );
    //console.log("check 3 ");
    // Store session in DB
    await Session.create({
        user_id: user._id,
        refresh_token: refreshToken,
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });
    //console.log("check 4");
    return { user, accessToken, refreshToken };
};

const verifyRefreshToken = async ({ refreshToken }) => {
    console.log(":: " + refreshToken);
    const token = refreshToken;//.split(" ")[1];
    //console.log(":: f "+ token);
    if (!refreshToken) {
        throw new Error("Unauthorized");
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        // Attach user info to request
        //req.user = { id: decoded.userId, role: decoded.role, token: token };
        return { decoded, token };
    } catch (error) {
        console.log(error);
        throw new Error("Invalid refresh token");
    }
};

const refresh_token = async ({ refreshToken }) => {
    //console.log(">> "+ refreshToken);
    if (!refreshToken) {
        throw new Error("Refresh token is required");
    }

    try {
        // Verify refresh token
        const { decoded, token } = await verifyRefreshToken({ refreshToken });
        console.log("wtf " + decoded.email + " pp " + refreshToken);

        // Check if refresh token exists in the database
        const session = await Session.findOne({ user_id: decoded.id, refresh_token: token });

        if (!session) {
            //console.log("here" + session);
            throw new Error("Invalid refresh token")
        }
        // Check if user exists
        const user = await User.findOne({ email: decoded.email });
        //console.log("aa ", user );
        // Generate new access token
        const accessToken = generateAccessToken(user);
        //console.log("bb");
        // Optionally rotate the refresh token
        const newRefreshToken = generateRefreshToken(user);
        //console.log("cc");
        // Update the refresh token in the database (if rotating)
        session.refresh_token = newRefreshToken;
        await session.save();
        // console.log("dd",user,
        //     accessToken,
        //     newRefreshToken);
        // // Return new tokens
        return {
            user,
            accessToken,
            refreshToken: newRefreshToken,
        };
    } catch (err) {
        console.log(err);
        throw new Error('Invalid refresh token');
    }
};

const test = async ({ user_id, token }) => {
    try {
        // Perform DB checks here
        const session = await Session.findOne({ user_id: user_id, token: token });
        //console.log("jake ",user_id, token);
        if (!session) {
            throw new Error("invalid session");
        }
        //console.log("rich 1.0");
        // // Check if session is expired
        if (new Date() > session.expires_at) {
            await Session.deleteOne({ token }); // Remove expired session
            throw new Error("error: Session expired. Please log in again.");
        }
        //console.log("rich 2");
        // Continue processing if session is valid
        return { session };
    } catch (error) {
        console.log(error);
        throw new Error("error");
    }
};

const logoutUser = async (userId) => {
    await Session.deleteMany({ user_id: userId });
};


const https = require('https');

const googleMobileLogin = async ({ idToken, accessToken, req }) => {
    let googleUser;

    try {
        if (accessToken) {
            // Web flow: Use access token to fetch user info
            console.log('Using web flow with accessToken');
            googleUser = await new Promise((resolve, reject) => {
                https.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            if (res.statusCode === 200) {
                                resolve(parsed);
                            } else {
                                console.error('Google API Error:', parsed);
                                reject(new Error(parsed.error_description || 'Invalid Google Access Token'));
                            }
                        } catch (err) {
                            reject(new Error('Failed to parse Google response'));
                        }
                    });
                }).on('error', (err) => reject(err));
            });
        } else if (idToken) {
            // Mobile flow: Verify ID token
            console.log('Using mobile flow with idToken');
            googleUser = await new Promise((resolve, reject) => {
                https.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            if (res.statusCode === 200) {
                                resolve(parsed);
                            } else {
                                console.error('Google Token Verification Error:', parsed);
                                reject(new Error(parsed.error_description || 'Invalid Google ID Token'));
                            }
                        } catch (err) {
                            reject(new Error('Failed to parse Google response'));
                        }
                    });
                }).on('error', (err) => reject(err));
            });
        } else {
            throw new Error('Either idToken or accessToken is required');
        }

        console.log('Google User Data:', googleUser);

        // Extract user info (field names differ between tokeninfo and userinfo endpoints)
        const email = googleUser.email;
        const name = googleUser.name || googleUser.given_name || email.split('@')[0];
        const googleId = googleUser.sub || googleUser.user_id;
        const picture = googleUser.picture;

        if (!email) {
            throw new Error('Email not provided by Google');
        }

        let user = await User.findOne({ email });

        if (!user) {
            // Create new user
            // Generate a random password as they will use Google to login
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = new User({
                username: name,
                full_name: name,
                email: email,
                password_hash: hashedPassword,
                googleId: googleId,
                profileImage: picture,
                role: 'user', // Default role
                is_active: true,
                is_verified: true,
                created_at: new Date(),
                updated_at: new Date()
            });
            await user.save();
            console.log('New user created:', user.email);
        } else {
            // Update existing user with Google info if not already set
            if (!user.googleId) {
                user.googleId = googleId;
                if (!user.profileImage) user.profileImage = picture;
                user.updated_at = new Date();
                await user.save();
                console.log('Existing user updated with Google info:', user.email);
            }
        }

        if (!user.is_active) {
            throw new Error("Your account is deactivated. Contact support.");
        }

        // Generate JWT tokens for your app (renamed to avoid conflict with Google's accessToken parameter)
        const appAccessToken = generateAccessToken(user);
        const appRefreshToken = generateRefreshToken(user);

        await Session.create({
            user_id: user._id,
            refresh_token: appRefreshToken,
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
            expires_at: new Date(Date.now() + 60 * 60 * 1000)
        });

        console.log("Google login successful for user:", user.email);
        return { user, accessToken: appAccessToken, refreshToken: appRefreshToken };

    } catch (error) {
        console.error('Google Login Error:', error.message);
        throw error;
    }
};
module.exports = { googleMobileLogin, registerUser, loginUser, loginAdmin, verifyAccount, test, refresh_token, logoutUser };
