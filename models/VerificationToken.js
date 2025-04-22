const mongoose = require("mongoose");

const VerificationTokenSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    created_at: { type: Date, default: Date.now, expires: 86400 }, // Expires in 24 hours
});

module.exports = mongoose.model("VerificationToken", VerificationTokenSchema);
