const mongoose = require('mongoose');

const virtualTourSchema = new mongoose.Schema({
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startImageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VirtualTourImage',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const VirtualTour = mongoose.model('VirtualTour', virtualTourSchema);
module.exports = VirtualTour;
