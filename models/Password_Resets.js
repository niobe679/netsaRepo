const mongoose = require("mongoose");
const Password_ResetsSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    reset_token: { type: String, required: true, unique: true },
    created_at: { type: String, required: true, unique: true },
    updated_at: { type: String, required: true, unique: true }    
});
module.exports = mongoose.model('Password_Resets', Password_ResetsSchema);