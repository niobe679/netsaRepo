const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    // if (!req.session.user) {
    //     //alert("Your session has expired! please login again");
    //     return res.redirect("/admin/login")//.send('Unauthorized: Please log in.');
    // }
    const token = req.headers.authorization?.split(" ")[1];
    console.log(":: "+ token, req.headers.authorization);
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("decoded ",decoded);
        // Attach user info to request
        req.user = { id: decoded.id, role: decoded.role, token: token };
        if (req.user.role !== 'admin') {
            return res.status(403).send('Forbidden: Admin access only.');
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(403).json({ error: "Invalid token" });
        }

};