const authService = require("../services/authservice");
const Property = require('../models/Property');
const { cloudinary, upload, cdeleteProperty } = require('../utils/config/cloudinary'); // Import from config

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("check 1 ");
        // Call the service to handle login logic
        const { user, accessToken, refreshToken } = await authService.loginAdmin({ email, password, req });
        console.log("check 2");
        //               `      .session.user = user;
        // Send token in HTTP-only cookie
        res.cookie("rftoken", refreshToken,"token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Secure only in production
            sameSite: "Strict",
        });

        res.status(200).json({ message: "Admin Login successful", user, accessToken, refreshToken });
    } catch (error) {
        console.log(error)
        res.status(400).json({ error: error.message });
    }
};

const test = async (req, res)=>{
    try {
        console.log("PP " +req.user.id)
        //const session = await authService.test({user_id: req.user.id, token: req.user.token })
 
        res.status(200).json({ message: "Success", data: req.user.token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
};

const refresh_token = async (req, res)=>{
    try {
        console.log("token here " + req.body.refreshToken);
        const {user, accessToken, refreshToken} = await authService.refresh_token({refreshToken: req.body.refreshToken})
        
        res.status(200).json({ message: "Success", data: {user, accessToken, refreshToken} });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Server error, please try again later." });
    }
};

const logoutUser = async (req, res) => {
    try {
        await authService.logoutUser(req.user.id);
        res.clearCookie("token");
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// const bulkImport = async (req, res) => {
//   try {
//     const properties = req.body.properties;

//     if (!Array.isArray(properties) || properties.length === 0) {
//       return res.status(400).json({ message: "No properties received" });
//     }

//     // Optional: sanitize or validate each property before insert
//     const formatted = properties.map((p) => ({
//       name: p.name || "",
//       location: p.location || "",
//       price: Number(p.price) || 0,
//       bedrooms: Number(p.bedrooms) || 0,
//       squarefeet: Number(p.squarefeet) || 0,
//       type: p.type || "unknown",
//       rob: p.rob || "rent",
//       imageUrl: [], // images to be added later
//     }));

//     const result = await Property.insertMany(formatted);

//     res.status(201).json({
//       message: `✅ ${result.length} properties imported`,
//       inserted: result,
//     });
//   } catch (err) {
//     console.error("❌ Bulk import failed:", err);
//     res.status(500).json({ error: "Bulk import failed", details: err.message });
//   }
// };

// const getProperties = async (req, res) => {
//   try {
//     const properties = await Property.find();
//     res.status(200).json(properties);   }
//   catch (err) {
//     console.error("Error fetching properties:", err);
//     res.status(500).json({ error: "Failed to fetch properties", details: err.message });
//   }
// };

// const addProperties = async (req, res) => {

//   try {
//     console.log("Cloudinary config:", cloudinary.config());

//     const rawData = req.body.properties;
//     const parsed = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
//     const files = req.files || [];

//     // Group files by field name: images_0, images_1, etc.
//     const groupedFiles = {};
//     for (const file of files) {
//       const match = file.fieldname.match(/^images_(\d+)/);
//       if (match) {
//         const index = parseInt(match[1], 10);
//         if (!groupedFiles[index]) groupedFiles[index] = [];

//         const imageOrders = parsed[index]?.imageOrders;
//         groupedFiles[index].push({
//           url: file.path,
//           public_id: file.filename,
//           order: imageOrders?.[groupedFiles[index].length] ?? groupedFiles[index].length,
//         });
//       }
//     }


//     const saved = [];

//     for (let i = 0; i < parsed.length; i++) {
//       const prop = parsed[i];
//       console.log("Saving property:", {
//   ...prop,
//   imageUrl: groupedFiles[i]
// });
// console.log("Parsed property imageOrders:", parsed[i]?.imageOrders);

//       const property = new Property({
//         ...prop,
//         imageUrl: groupedFiles[i],
//       });
//       await property.save();
//       saved.push(property);
//     }

//     res.status(201).json({
//       message: `${saved.length} property(ies) created`,
//       properties: saved,
//     });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ error: "Upload failed", details: err.message });
//   }
// };

// const updateProperty = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const property = await Property.findById(id);
//     if (!property) return res.status(404).json({ message: "Property not found" });

//     // Parse the sent JSON fields (stringified in FormData)
//     const body = req.body;
//     const parsedImageUrl = JSON.parse(body.imageUrl || "[]");

//     // Group new uploaded files by original filename (cloudinary auto-generated names)
//     const uploadedFiles = {};
//     for (const file of req.files || []) {
//       uploadedFiles[file.originalname] = {
//         url: file.path,
//         public_id: file.filename,
//       };
//     }

//     // Merge and rebuild imageUrl with correct order
//     const finalImages = parsedImageUrl.map((img, i) => {
//       if (img.fileName && uploadedFiles[img.fileName]) {
//         // 🆕 Image was uploaded
//         return {
//           ...uploadedFiles[img.fileName],
//           order: i,
//         };
//       } else {
//         // 🧾 Existing image
//         return {
//           url: img.url,
//           public_id: img.public_id,
//           order: i,
//         };
//       }
//     });

//     // (Optional) Remove old Cloudinary images no longer used
//     const oldPublicIds = property.imageUrl.map((img) => img.public_id);
//     const newPublicIds = finalImages.map((img) => img.public_id);
//     const removed = oldPublicIds.filter((id) => !newPublicIds.includes(id));
//     for (const id of removed) {
//       await cloudinary.uploader.destroy(id);
//     }

//     // Update fields
//     property.set({
//       ...body,
//       imageUrl: finalImages,
//     });

//     await property.save();
//     res.json({ message: "Property updated", property });
//   } catch (err) {
//     console.error("Edit error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// const deleteProperty = async (req, res) => {
//   try {
//     const property = await Property.findById(req.params.id);
//     if (!property) return res.status(404).json({ message: "Property not found" });
//     if (Property.imageUrl!=null)
//     // Delete each image from Cloudinary
//     {
//       for (const img of property.imageUrl) {
//       await cloudinary.uploader.destroy(img.public_id);
//       }
//     }
//     await property.deleteOne(); // or property.remove()
//     res.json({ message: "Property deleted" });
//   } catch (err) {
//     console.error("Delete error:", err);
//     res.status(500).json({ message: "Failed to delete property" });
//   }
// };

module.exports = {login, test, refresh_token, logoutUser};