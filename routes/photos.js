const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Photo = require('../models/Photo');
const auth = require('../middleware/auth');
const { uploadToBunny, deleteFromBunny } = require('../utils/bunny');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

// GET /api/photos
router.get('/', async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/photos/:id
router.get('/:id', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    res.json(photo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/photos/upload — upload to Bunny + save to DB (admin only)
router.post('/upload', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { title, description, category } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileName = `photos/${uuidv4()}${ext}`;
    const url = await uploadToBunny(req.file.buffer, fileName, req.file.mimetype);
    const photo = new Photo({
      title: title || req.file.originalname,
      description: description || '',
      url,
      fileName,
      category: category || 'general',
    });
    await photo.save();
    res.status(201).json(photo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/photos/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    await deleteFromBunny(photo.fileName);
    await photo.deleteOne();
    res.json({ message: 'Photo deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/photos/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    res.json(photo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;