module.exports = (req, res, next) => {
    if (!req.session.user) {
        //alert("Your session has expired! please login again");
        return res.redirect("/admin/login")//.send('Unauthorized: Please log in.');
    }
    if (req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden: Admin access only.');
    }
    next();
};