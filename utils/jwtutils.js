// utils/jwtUtils.js
const jwt = require('jsonwebtoken');

// Generate Access Token
const generateAccessToken = (user) => {
    //console.log(process.env.ACCESS_TOKEN_SECRET+" :: "+process.env.REFRESH_TOKEN_SECRET+" \\ ", user);
    return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
};

// Generate Refresh Token
const generateRefreshToken = (user) => {
    //console.log(process.env.ACCESS_TOKEN_SECRET+" :: "+process.env.REFRESH_TOKEN_SECRET+" \\ ", user);
    console.log(">> ", user);
    return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};


module.exports = {
    generateAccessToken,
    generateRefreshToken,
};