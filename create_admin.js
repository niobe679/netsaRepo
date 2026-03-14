const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI_Local);
        console.log("Connected.");

        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Check if admin exists
        const existing = await User.findOne({ email: 'admin@example.com' });
        if (existing) {
            console.log("Admin already exists, updating role...");
            existing.role = 'admin';
            existing.password_hash = hashedPassword;
            await existing.save();
            console.log("Admin updated.");
        } else {
            const admin = new User({
                username: 'admin',
                full_name: 'Admin User',
                email: 'admin@example.com',
                password_hash: hashedPassword,
                role: 'admin',
                created_at: new Date(),
                is_active: true,
                is_verified: true
            });
            await admin.save();
            console.log('Admin created');
        }

    } catch (e) {
        console.log('Error creating admin:', e);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

createAdmin();
