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

const getPropertyOwner = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Property ID:", id);
    const ownerId = await Property.findById(id).select('createdBy');
    console.log("Owner ID:", ownerId.createdBy);
    if (!ownerId) return res.status(404).json({ message: "Property or owner not found" });
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

    const rawData = req.body.properties;
    const parsed = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
    const files = req.files || [];

    // Group files by fiel d name: images_0, images_1, etc.
    const groupedFiles = {};
    for (const file of files) {
      const match = file.fieldname.match(/^images_(\d+)/);
      if (match) {
        const index = parseInt(match[1], 10);
        if (!groupedFiles[index]) groupedFiles[index] = [];

        const imageOrders = parsed[index]?.imageOrders;
        groupedFiles[index].push({
          url: file.path,
          public_id: file.filename,
          order: imageOrders?.[groupedFiles[index].length] ?? groupedFiles[index].length,
        });
      }
    }


    const saved = [];

    for (let i = 0; i < parsed.length; i++) {
      const prop = parsed[i];
      console.log("Saving property:", {
  ...prop,
  imageUrl: groupedFiles[i]
});
console.log("Parsed property imageOrders:", parsed[i]?.imageOrders);

      const property = new Property({
        ...prop,
        imageUrl: groupedFiles[i],
        createdBy: req.user.id, // Assuming req.user.id is the ID of the user creating the property
        updatedBy: req.user.id, // Assuming req.user.id is the ID of the user updating the property
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

    // Parse the sent JSON fields (stringified in FormData)
    const body = req.body;
    const parsedImageUrl = JSON.parse(body.imageUrl || "[]");

    // Group new uploaded files by original filename (cloudinary auto-generated names)
    const uploadedFiles = {};
    for (const file of req.files || []) {
      uploadedFiles[file.originalname] = {
        url: file.path,
        public_id: file.filename,
      };
    }

    // Merge and rebuild imageUrl with correct order
    const finalImages = parsedImageUrl.map((img, i) => {
      if (img.fileName && uploadedFiles[img.fileName]) {
        // 🆕 Image was uploaded
        return {
          ...uploadedFiles[img.fileName],
          order: i,
        };
      } else {
        // 🧾 Existing image
        return {
          url: img.url,
          public_id: img.public_id,
          order: i,
        };
      }
    });

    // (Optional) Remove old Cloudinary images no longer used
    const oldPublicIds = property.imageUrl.map((img) => img.public_id);
    const newPublicIds = finalImages.map((img) => img.public_id);
    const removed = oldPublicIds.filter((id) => !newPublicIds.includes(id));
    for (const id of removed) {
      await cloudinary.uploader.destroy(id);
    }

    // Update fields
    property.set({
      ...body,
      updatedBy: req.user.id, // Assuming req.user.id is the ID of the user making the update
      imageUrl: finalImages,
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
    if (Property.imageUrl!=null)
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

module.exports = {bulkImport, getProperties, addProperties, updateProperty, deleteProperty, getPublicProperties, getFeaturedProperty, toggleFeaturedProperty, getPropertyOwner};