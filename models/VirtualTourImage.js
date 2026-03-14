const mongoose = require('mongoose');

const virtualTourImageSchema = new mongoose.Schema({
    tourId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VirtualTour',
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    public_id: {
        type: String // For Cloudinary or similar storage
    },
    type: {
        type: String,
        enum: ['flat', 'panorama'],
        default: 'flat'
    },
    roomName: {
        type: String,
        default: 'New Room'
    },
    viewName: {
        type: String,
        default: 'Main View'
    },
    links: [{
        targetImageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VirtualTourImage'
        },
        label: String,
        x: {
            type: Number,
            // required: true, // Made optional for panorama
            min: 0,
            max: 1
        },
        y: {
            type: Number,
            // required: true, // Made optional for panorama
            min: 0,
            max: 1
        },
        yaw: Number,
        pitch: Number,
        arrowType: {
            type: String,
            default: 'arrow-up' // arrow-up, arrow-down, arrow-left, arrow-right, info, circle
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const VirtualTourImage = mongoose.model('VirtualTourImage', virtualTourImageSchema);
module.exports = VirtualTourImage;
