const { body, validationResult } = require("express-validator");

const validateRegistration = [
    
    body("email").isEmail().withMessage("Invalid email format"),
    
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    (req, res, next) => {
        console.log(req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {    
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next(); // Move to the next function (controller)
    }
];

module.exports = validateRegistration;