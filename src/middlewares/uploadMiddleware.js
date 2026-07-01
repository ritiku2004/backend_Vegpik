const multer = require('multer');
const path = require('path');
const fs = require('fs');

const sharp = require('sharp');

// Memory storage to process files using sharp before saving
const storage = multer.memoryStorage();

const uploadRaw = multer({ 
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB limit before processing
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

const uploadSingle = (fieldname) => {
  const uploadMiddleware = uploadRaw.single(fieldname);

  return (req, res, next) => {
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      if (!req.file) {
        return next();
      }

      try {
        let envUploadDir = process.env.UPLOAD_DIR;
        if (envUploadDir && envUploadDir.startsWith('home/')) {
          envUploadDir = '/' + envUploadDir;
        }

        let baseUploadDir = envUploadDir 
          ? path.resolve(envUploadDir) 
          : path.join(__dirname, '../../uploads');

        // Determine type (subdirectory: products, categories, banners, users)
        let type = req.query.type || req.body.type;
        if (!type) {
          if (req.file.fieldname === 'avatar') {
            type = 'users';
          } else {
            const url = req.originalUrl || '';
            if (url.includes('category') || url.includes('categories')) {
              type = 'categories';
            } else if (url.includes('banner') || url.includes('banners')) {
              type = 'banners';
            } else if (url.includes('product') || url.includes('products')) {
              type = 'products';
            } else if (url.includes('user') || url.includes('users') || url.includes('profile')) {
              type = 'users';
            } else {
              type = 'users'; // fallback for payment screenshots etc.
            }
          }
        }

        const allowedTypes = ['products', 'categories', 'banners', 'users'];
        const subDir = allowedTypes.includes(type) ? type : 'users';
        let targetDir = path.join(baseUploadDir, subDir);

        // Try to create target directory; if it fails (e.g., production path on local Windows),
        // fall back to local uploads/ directory
        try {
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          // On Windows, path.resolve('/home/...') silently creates a local Windows path
          // instead of failing. Detect this so we use local IP for the URL, not BASE_URL.
          const isWindowsDev = process.platform === 'win32' && process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.startsWith('home/');
          if (isWindowsDev) {
            req.file.isLocalFallback = true;
          }
        } catch (mkdirErr) {
          console.warn('[Upload] Could not create dir at configured path, falling back to local uploads/:', mkdirErr.message);
          baseUploadDir = path.join(__dirname, '../../uploads');
          targetDir = path.join(baseUploadDir, subDir);
          if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
          }
          req.file.isLocalFallback = true; // Signal to URL builder to use local IP, not BASE_URL
        }

        // Generate unique filename with .webp extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `${req.file.fieldname}-${uniqueSuffix}.webp`;
        const filepath = path.join(targetDir, filename);

        // Compress and convert to WebP using Sharp
        await sharp(req.file.buffer)
          .webp({ quality: 80 })
          .toFile(filepath);

        // Build a URL for local dev (will be relative; production uses BASE_URL)
        const baseUrl = process.env.BASE_URL || `http://${req.hostname}:${process.env.PORT || 3000}`;
        req.file.publicUrl = `${baseUrl}/${subDir}/${filename}`;

        // Update req.file details so downstream helpers/controllers work seamlessly
        req.file.filename = filename;
        req.file.destination = targetDir;
        req.file.path = filepath;
        req.file.mimetype = 'image/webp';
        
        // Clear buffer from memory
        delete req.file.buffer;

        next();
      } catch (sharpError) {
        console.error('Sharp processing error:', sharpError);
        return next(sharpError);
      }
    });
  };
};

const upload = {
  single: uploadSingle
};

module.exports = upload;
