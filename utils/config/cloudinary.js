//import { v2 as cloudinary } from 'cloudinary';
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Property = require('../../models/Property');
// (async function() {

//     // Configuration
//     cloudinary.config({ 
//         cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//         api_key: process.env.CLOUDINARY_API_KEY,
//         api_secret: process.env.CLOUDINARY_API_SECRET    
//          // Click 'View API Keys' above to copy your API secret
//     });
//     //API env var = CLOUDINARY_URL=cloudinary://636929815836638:Irz8tkhJTMkuQDUEzJfZGrj7-AU@du79x46rk
//     // Upload an image
//      const uploadResult = await cloudinary.uploader
//        .upload(
//            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
//                public_id: 'shoes',
//            }
//        )
//        .catch((error) => {
//            console.log(error);
//        });
    
//     console.log(uploadResult);
    
//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url('shoes', {
//         fetch_format: 'auto',
//         quality: 'auto'
//     });
    
//     console.log(optimizeUrl);
    
//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url('shoes', {
//         crop: 'auto',
//         gravity: 'auto',
//         width: 500,
//         height: 500,
//     });
    
//     console.log(autoCropUrl);    
// })();


// Configure Multer Storage for Cloudinary
    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET    
         // Click 'View API Keys' above to copy your API secret
    });

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'properties', // Folder name in Cloudinary
        allowed_formats: ['jpeg', 'png', 'jpg'],
    },
});


async function deleteProperty(req, res) {
    console.log("check "+ req.params);
    try {
        const { id } = req.params; // Property ID from the request parameters
  
        // Find the property by ID
        const property = await Property.findById(id);

      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
  
      // Delete images from Cloudinary
      const imageDeletionPromises = property.imageUrl.map((image) =>
        cloudinary.uploader.destroy(image.public_id)
      );
      await Promise.all(imageDeletionPromises);
  
      // Delete the property from the database
      await Property.findByIdAndDelete(id);

  
      res.status(200).json({ message: 'Property and associated images deleted successfully' });
    } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
const upload = multer({ storage });

module.exports = { cloudinary, upload, deleteProperty };