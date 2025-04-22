const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    full_name: { type: String, required: true, unique: true },
    googleId: {type: String},
    profileImage: {type: String},
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true, unique: true },
    phone_number: { type: String, unique: true },
    role: { type: String }, // Add role here
    is_verified: { type: Boolean},
    is_active: { type: Boolean },
    created_at: { type: Date, required: true },
    updated_at: { type: Date}    
});
module.exports = mongoose.model('User', UserSchema);