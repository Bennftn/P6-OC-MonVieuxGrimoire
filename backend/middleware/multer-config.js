const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 Mo
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype);
    cb(ok ? null : new Error('Format image invalide'), ok);
  }
}).single('image');

module.exports = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Upload invalide' });
    if (!req.file) return next();

    try {
      const outDir = path.join(__dirname, '..', 'images');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

      const filename = `book_${Date.now()}.webp`;
      const outPath = path.join(outDir, filename);

      await sharp(req.file.buffer).resize(600).webp({ quality: 80 }).toFile(outPath);

      req.savedImageName = filename;
      next();
    } catch {
      return res.status(500).json({ message: 'Erreur traitement image' });
    }
  });
};
