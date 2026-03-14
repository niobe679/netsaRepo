const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const VirtualTour = require('../models/VirtualTour');
const VirtualTourImage = require('../models/VirtualTourImage');
const Property = require('../models/Property');
const { authenticateToken } = require("../middlewares/authenticatetoken");
const { upload, cloudinary } = require('../utils/config/cloudinary');

// Create a new virtual tour
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { propertyId } = req.body;

        if (!propertyId) {
            return res.status(400).json({ error: 'Property ID is required' });
        }

        // Check if property exists and user has permission
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ error: 'Property not found' });
        }

        if (property.createdBy && property.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to create tour for this property' });
        }

        // Check if tour already exists
        if (property.virtualTourId) {
            return res.status(400).json({ error: 'Property already has a virtual tour' });
        }

        const newTour = new VirtualTour({
            propertyId,
            createdBy: req.user.id
        });

        await newTour.save();

        // Link tour to property
        property.virtualTourId = newTour._id;
        await property.save();

        res.status(201).json(newTour);
    } catch (error) {
        console.error('Error creating virtual tour:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get virtual tour by ID (Public)
router.get('/:id', async (req, res) => {
    try {
        const tour = await VirtualTour.findById(req.params.id)
            .populate('propertyId', 'name location')
            .populate('startImageId');

        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }

        const images = await VirtualTourImage.find({ tourId: tour._id });

        res.json({ tour, images });
    } catch (error) {
        console.error('Error fetching virtual tour:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Upload image and attach to tour
router.post('/:id/images', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const tour = await VirtualTour.findById(req.params.id);
        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }

        if (tour.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to edit this tour' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const newImage = new VirtualTourImage({
            tourId: tour._id,
            imageUrl: req.file.path,
            public_id: req.file.filename,
            roomName: req.body.roomName || 'New Room',
            viewName: req.body.viewName || 'View 1'
        });

        await newImage.save();

        // Set as start image if none exists
        if (!tour.startImageId) {
            tour.startImageId = newImage._id;
            await tour.save();
        }

        res.status(201).json(newImage);
    } catch (error) {
        console.error('Error uploading tour image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update image metadata and links
router.put('/images/:imageId', authenticateToken, async (req, res) => {
    try {
        const { roomName, viewName, links, isStartImage, type } = req.body;
        const image = await VirtualTourImage.findById(req.params.imageId);

        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const tour = await VirtualTour.findById(image.tourId);
        if (tour.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to edit this tour' });
        }

        if (roomName) image.roomName = roomName;
        if (viewName) image.viewName = viewName;
        if (links) image.links = links;
        if (type) image.type = type;

        await image.save();

        if (isStartImage) {
            tour.startImageId = image._id;
            await tour.save();
        }

        res.json(image);
    } catch (error) {
        console.error('Error updating tour image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete image
router.delete('/images/:imageId', authenticateToken, async (req, res) => {
    try {
        const image = await VirtualTourImage.findById(req.params.imageId);
        if (!image) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const tour = await VirtualTour.findById(image.tourId);
        if (tour.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to edit this tour' });
        }

        // Remove from Cloudinary
        if (image.public_id) {
            await cloudinary.uploader.destroy(image.public_id);
        }

        // Remove links to this image from other images
        await VirtualTourImage.updateMany(
            { tourId: tour._id },
            { $pull: { links: { targetImageId: image._id } } }
        );

        await VirtualTourImage.findByIdAndDelete(req.params.imageId);

        // If it was the start image, unset it properly or pick another one
        if (tour.startImageId && tour.startImageId.toString() === image._id.toString()) {
            const anotherImage = await VirtualTourImage.findOne({ tourId: tour._id });
            tour.startImageId = anotherImage ? anotherImage._id : null;
            await tour.save();
        }

        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Error deleting tour image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
