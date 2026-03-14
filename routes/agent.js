const express = require('express');
const router = express.Router();
const path = require('path');
const { cloudinary, upload } = require(path.join('../utils/config/cloudinary')); // Import from config
const { bulkImport, getProperties, addProperties, updateProperty, deleteProperty } = require("../controllers/propertycontroller");
const { authenticateToken, authenticateRefreshToken } = require("../middlewares/authenticatetoken");
//properties
// Get all properties
router.get('/main/properties', authenticateToken, getProperties);
//bulk add
router.post("/main/add-bulk", authenticateToken, bulkImport);
// Accept multiple fields: images_0, images_1, etc.
router.post("/main/addproperties", authenticateToken, upload.any(), addProperties);
//edit property data including deleting images
router.put("/main/properties/edit/:id", authenticateToken, upload.any(), updateProperty)
//delete property
router.delete("/main/properties/:id", authenticateToken, deleteProperty);

module.exports = router;