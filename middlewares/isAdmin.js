module.exports = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).send('Unauthorized: Please log in.');
    }
    if (req.session.user.role !== 'admin') {
        return res.status(403).send('Forbidden: Admin access only.');
    }
    next();
};