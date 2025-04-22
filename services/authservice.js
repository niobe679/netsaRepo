const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const emailService = require("../utils/emailservice");
const jwt = require("jsonwebtoken");
const Session = require("../models/Session");
const { generateAccessToken, generateRefreshToken } = require('../utils/jwtutils');

const registerUser = async ({ username, full_name, email, password, phone_number, role }) => {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error("Email is already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save user
    const user = new User({ username, full_name, email, password_hash: hashedPassword, phone_number, role, is_verified: true, is_active: true, created_at: new Date(), updated_at: new Date() });
    await user.save();

    return user;
    // Generate verification token
    // const token = crypto.randomBytes(32).toString("hex");
    // await VerificationToken.create({ user_id: user._id, token });

    // // Send verification email
    // const verifyLink = `${process.env.BASE_URL}/api/auth/verify/${token}`;
    // await emailService.sendEmail(email, "Verify Your Account", `Click to verify: ${verifyLink}`);

    // return "Registration successful! Please check your email to verify your account.";
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
    //console.log(":: "+ refreshToken);
    const token = refreshToken.split(" ")[1];
    //console.log(":: f "+ token);
    if (!token) {
        throw new error( "Unauthorized" );
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        // Attach user info to request
        //req.user = { id: decoded.userId, role: decoded.role, token: token };
        return { decoded, token };
    } catch (error) {
        console.log(error);
        throw new error(  "Invalid refresh token" );
    }
};

const refresh_token = async ({refreshToken}) => {
    //console.log(">> "+ refreshToken);
    if (!refreshToken) {
        throw new Error("Refresh token is required");
    }

    try {
        // Verify refresh token
        const {decoded, token} = await verifyRefreshToken({refreshToken});
        //console.log("wtf "+ decoded.email +" pp "+ refreshToken);

        // Check if refresh token exists in the database
        const session = await Session.findOne({ user_id: decoded.id, refresh_token: token });
        
        if (!session) {
            //console.log("here" + session);
            throw new Error("Invalid refresh token")
        }
        // Check if user exists
        const user = await User.findOne({email: decoded.email});
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
        throw new Error( 'Invalid refresh token' );
    }
};

const test = async({user_id, token})=>{
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

module.exports = { registerUser, loginUser,loginAdmin, verifyAccount, test, refresh_token, logoutUser };
