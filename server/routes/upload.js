import express from 'express';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';

const router = express.Router();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit to match frontend
});

// Wrapper to catch multer errors explicitly
router.post('/', (req, res, next) => {

  upload.single('file')(req, res, async (err) => {
    
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large. Limit is 10MB.' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      // Ensure we always send a JSON string, even for unknown errors
      const errMsg = typeof err === 'string' ? err : (err.message || 'Unknown upload error');
      return res.status(500).json({ message: errMsg });
    }

    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
        return res.status(500).json({ message: 'Cloudinary is not configured. Please add keys to .env' });
      }


      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded or file format not supported' });
      }

      res.status(200).json({
        url: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        fileName: req.file.originalname
      });
    } catch (error) {
      res.status(500).json({ message: error.message || 'Error uploading to cloud storage' });
    }
  });
});

export default router;
