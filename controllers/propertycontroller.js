const Property = require('../models/Property');
const { cloudinary, upload, cdeleteProperty } = require('../utils/config/cloudinary'); // Import from config
const User = require('../models/User');
const bulkImport = async (req, res) => {
  try {
    const properties = req.body.properties;

    if (!Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({ message: "No properties received" });
    }

    // Optional: sanitize or validate each property before insert
    const formatted = properties.map((p) => ({
      name: p.name || "",
      location: p.location || "",
      price: Number(p.price) || 0,
      bedrooms: Number(p.bedrooms) || 0,
      squarefeet: Number(p.squarefeet) || 0,
      type: p.type || "unknown",
      rob: p.rob || "rent",
      createdBy: req.user.id || null, // Assuming createdBy is optional
      updatedBy: req.user.id || null, // Assuming updatedBy is optional
      imageUrl: [], // images to be added later
    }));

    const result = await Property.insertMany(formatted);

    res.status(201).json({
      message: `✅ ${result.length} properties imported`,
      inserted: result,
    });
  } catch (err) {
    console.error("❌ Bulk import failed:", err);
    res.status(500).json({ error: "Bulk import failed", details: err.message });
  }
};

const getProperties = async (req, res) => {
  try {
    const properties = await Property.find();
    if (!properties || properties.length === 0) {
      return res.status(404).json({ message: "No properties found" });
    }
    if (req.user.role === 'admin') {
      // Admin can see all properties
      return res.status(200).json(properties);
    } else {
      // Regular users can only see their own properties
      console.log("User ID:", req.user.id);
      console.log("All properties:", properties);
      const userProperties = properties.filter(property => property.createdBy?.toString() === req.user.id);
      console.log("User properties:", userProperties);
      return res.status(200).json(userProperties);
    }
  }
  catch (err) {
    console.error("Error fetching properties:", err);
    res.status(500).json({ error: "Failed to fetch properties", details: err.message });
  }
};

const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  } catch (err) {
    console.error("Error fetching property:", err);
    res.status(500).json({ error: "Failed to fetch property", details: err.message });
  }
};

const getPropertyOwner = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Property ID:", id);
    const ownerId = await Property.findById(id).select('createdBy');
    if (!ownerId || !ownerId.createdBy) {
      console.log("Owner not found for property:", id);
      return res.status(404).json({ message: "Property or owner not found" });
    }
    console.log("Owner ID:", ownerId.createdBy);
    const owner_name = await User.findById(ownerId.createdBy).select('full_name');
    const owner_number = await User.findById(ownerId.createdBy).select('phone_number');
    console.log("Owner:", owner_name, owner_number);
    res.json({ full_name: owner_name.full_name, phone_number: owner_number.phone_number });
  } catch (err) {
    console.error("Error fetching property owner:", err);
    return null;
  }
};

const getPublicProperties = async (req, res) => {
  try {
    const properties = await Property.find();
    if (!properties || properties.length === 0) {
      return res.status(404).json({ message: "No properties found" });
    }
    res.status(200).json(properties);
  } catch (err) {
    console.error("Error fetching public properties:", err);
    res.status(500).json({ error: "Failed to fetch public properties", details: err.message });
  }
};

const addProperties = async (req, res) => {
  try {
    console.log("Cloudinary config:", cloudinary.config());
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);

    let parsed;
    const rawData = req.body.properties;

    if (rawData) {
      parsed = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
    } else {
      const { properties, ...singleProp } = req.body;
      parsed = [singleProp];
    }

    if (!Array.isArray(parsed)) {
      parsed = [parsed];
    }

    const files = req.files || [];
    const groupedFiles = {};

    // 1. Collect from Files (Real Uploads)
    for (const file of files) {
      const match = file.fieldname.match(/^images_(\d+)/);
      let index = 0;
      if (match) {
        index = parseInt(match[1], 10);
      } else if (parsed.length === 1) {
        index = 0;
      } else {
        continue;
      }

      if (!groupedFiles[index]) groupedFiles[index] = [];
      const imageOrders = parsed[index]?.imageOrders;
      groupedFiles[index].push({
        url: file.path,
        public_id: file.filename,
        order: imageOrders?.[groupedFiles[index].length] ?? groupedFiles[index].length,
      });
    }

    // 2. Collect from Body (Mock/Direct URLs)
    for (const key in req.body) {
      const match = key.match(/^images_(\d+)/);
      let index = -1;
      if (match) {
        index = parseInt(match[1], 10);
      } else if (parsed.length === 1 && key === 'imageUrl') {
        // Support direct imageUrl field if single property
        index = 0;
      }

      if (index === -1) continue;
      if (index >= parsed.length && parsed.length > 1) continue;

      const realIndex = (parsed.length === 1) ? 0 : index;
      if (!groupedFiles[realIndex]) groupedFiles[realIndex] = [];

      const value = req.body[key];
      const values = Array.isArray(value) ? value : [value];

      for (const v of values) {
        if (typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:image'))) {
          // Only add if not already present by URL
          if (!groupedFiles[realIndex].some(img => img.url === v)) {
            groupedFiles[realIndex].push({
              url: v,
              public_id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              order: groupedFiles[realIndex].length
            });
          }
        }
      }
    }

    const saved = [];

    for (let i = 0; i < parsed.length; i++) {
      const prop = parsed[i];
      let finalImages = groupedFiles[i] || [];

      // Check for stringified imageUrl if still empty
      if (finalImages.length === 0 && prop.imageUrl) {
        try {
          const imgData = typeof prop.imageUrl === 'string' ? JSON.parse(prop.imageUrl) : prop.imageUrl;
          finalImages = Array.isArray(imgData) ? imgData : [imgData];
        } catch (e) {
          console.warn("Could not parse prop.imageUrl", e);
        }
      }

      console.log(`Saving property ${i}:`, { ...prop, imageUrl: finalImages });

      const property = new Property({
        ...prop,
        imageUrl: finalImages,
        createdBy: req.user?.id || prop.createdBy || req.body.createdBy,
        updatedBy: req.user?.id || prop.updatedBy || req.body.updatedBy,
      });
      await property.save();
      saved.push(property);
    }

    res.status(201).json({
      message: `${saved.length} property(ies) created`,
      properties: saved,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
};

const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    const body = req.body;
    console.log("Update Body:", body);
    console.log("Update Files:", req.files);

    // 1. Gather all potential images
    let finalImages = [];

    // a. Check for JSON stringified imageUrl (current pattern)
    if (body.imageUrl) {
      try {
        const parsed = typeof body.imageUrl === 'string' ? JSON.parse(body.imageUrl) : body.imageUrl;
        finalImages = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.warn("Failed to parse body.imageUrl");
      }
    }

    // b. Group new uploaded files from Multer
    const uploadedFiles = {};
    for (const file of req.files || []) {
      // Use both fieldname and originalname to be safe
      uploadedFiles[file.fieldname] = {
        url: file.path,
        public_id: file.filename,
      };
      uploadedFiles[file.originalname] = uploadedFiles[file.fieldname];
    }

    // c. Collect string URLs from body (images_n or direct fields)
    for (const key in body) {
      if (key.startsWith('images_') || key === 'imageUrls') {
        const val = body[key];
        const vals = Array.isArray(val) ? val : [val];
        for (const v of vals) {
          if (typeof v === 'string' && (v.startsWith('http') || v.startsWith('data:image'))) {
            if (!finalImages.some(img => img.url === v)) {
              finalImages.push({
                url: v,
                public_id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              });
            }
          }
        }
      }
    }

    // d. Process files that matched images_n pattern
    for (const key in uploadedFiles) {
      const match = key.match(/^images_(\d+)/);
      if (match) {
        finalImages.push({
          ...uploadedFiles[key],
        });
      }
    }

    // 2. Resolve fileName placeholders from uploadedFiles if using the parsedImageUrl pattern
    finalImages = finalImages.map((img, i) => {
      if (img.fileName && uploadedFiles[img.fileName]) {
        return { ...uploadedFiles[img.fileName], order: i };
      }
      return { ...img, order: i };
    });

    // 3. Remove old Cloudinary images no longer used
    const oldPublicIds = property.imageUrl.map((img) => img.public_id);
    const newPublicIds = finalImages.map((img) => img.public_id);
    const removed = oldPublicIds.filter((id) => id && !newPublicIds.includes(id) && !id.startsWith('manual_'));

    for (const pid of removed) {
      try {
        await cloudinary.uploader.destroy(pid);
      } catch (e) {
        console.error("Failed to delete old image from Cloudinary", pid);
      }
    }

    // 4. Update the property object
    // Map 'description' to 'rob' if sent from mobile
    const updateData = { ...body };
    if (updateData.description && !updateData.rob) {
      updateData.rob = updateData.description;
    }

    property.set({
      ...updateData,
      imageUrl: finalImages,
      updatedBy: req.user?.id || body.updatedBy,
    });

    await property.save();
    res.json({ message: "Property updated", property });
  } catch (err) {
    console.error("Edit error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: "Property not found" });
    if (Property.imageUrl != null)
    // Delete each image from Cloudinary
    {
      for (const img of property.imageUrl) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }
    await property.deleteOne(); // or property.remove()
    res.json({ message: "Property deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Failed to delete property" });
  }
};

const getFeaturedProperty = async (req, res) => {
  try {
    const featuredProperty = await Property.find({ isFeatured: true });
    if (!featuredProperty) {
      return res.status(404).json({ message: "No featured property found" });
    }
    console.log("Featured Property:", featuredProperty);
    res.status(200).json(featuredProperty);
  } catch (err) {
    console.error("Error fetching featured property:", err);
    res.status(500).json({ error: "Failed to fetch featured property", details: err.message });
  }
}

const toggleFeaturedProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) return res.status(404).json({ message: "Property not found" });

    property.isFeatured = !property.isFeatured; // Toggle
    await property.save();

    res.json({
      message: `Property ${property.isFeatured ? "marked" : "unmarked"} as featured.`,
      isFeatured: property.isFeatured,
    });
  } catch (err) {
    console.error("Toggle feature error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { bulkImport, getProperties, addProperties, updateProperty, deleteProperty, getPublicProperties, getFeaturedProperty, toggleFeaturedProperty, getPropertyOwner, getPropertyById };