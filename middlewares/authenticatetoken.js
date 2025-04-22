const jwt = require("jsonwebtoken");

const authenticateToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    console.log(":: "+ token, req.headers.authorization);
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        //console.log("decoded ",decoded);
        // Attach user info to request
        req.user = { id: decoded.id, role: decoded.role, token: token };
        return res.status(200).json({ id: decoded.id, role: decoded.role, token: token  });
        //next();
    } catch (error) {
        console.log(error);
        return res.status(403).json({ error: "Invalid token" });
    }
};

const authenticateRefreshToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    //console.log(":: "+ token, req.headers.authorization);
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        //console.log("decoded ",decoded);
        // Attach user info to request
        req.user = { id: decoded.id, role: decoded.role, token: token };
        
        return res.status(200).json({ id: decoded.id, role: decoded.role, token: token  });
        //next();
    } catch (error) {
        console.log(error);
        return res.status(403).json({ error: "Invalid token" });
    }
};

module.exports = {authenticateToken, authenticateRefreshToken};