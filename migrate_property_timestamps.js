const mongoose = require('mongoose');
const Property = require('./models/Property');

// Update this with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/netsaproperties';

async function migrateProperties() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all properties without createdAt field
        const properties = await Property.find({ createdAt: { $exists: false } });

        console.log(`Found ${properties.length} properties without createdAt field`);

        if (properties.length === 0) {
            console.log('All properties already have timestamps. No migration needed.');
            process.exit(0);
        }

        // Update each property with current timestamp
        // Note: This sets all existing properties to the same timestamp
        // If you want to preserve relative order, you could use _id creation time
        const now = new Date();

        for (let i = 0; i < properties.length; i++) {
            const property = properties[i];

            // Option 1: Set all to current time
            property.createdAt = now;
            property.updatedAt = now;

            // Option 2 (commented): Extract timestamp from MongoDB ObjectId
            // This preserves the original creation order
            // const timestamp = property._id.getTimestamp();
            // property.createdAt = timestamp;
            // property.updatedAt = timestamp;

            await property.save();
            console.log(`Updated property ${i + 1}/${properties.length}: ${property.name}`);
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateProperties();
