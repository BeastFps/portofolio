const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const { uploadToBunny, deleteFromBunny } = require('../utils/bunny');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for FBX files
});

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }

});
// POST /api/projects — create a new project by name (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name is required' });
    const project = new Project({
      title: name,
      description: '',
      fbxUrl: '',
      thumbnailUrl: '',
      fileName: '',
      tags: [],
    });
    await project.save();
    res.status(201).json({ _id: project._id, name: project.title, order: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/projects/upload — upload FBX + thumbnail to Bunny (admin only)
router.post('/upload', auth, upload.fields([
  { name: 'fbx', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.fbx) return res.status(400).json({ message: 'No FBX file uploaded' });

    const { title, description, tags } = req.body;
    const fbxFile = req.files.fbx[0];
    const fbxExt = path.extname(fbxFile.originalname).toLowerCase();
    const fbxFileName = `projects/fbx/${uuidv4()}${fbxExt}`;
    const fbxUrl = await uploadToBunny(fbxFile.buffer, fbxFileName, fbxFile.mimetype || 'application/octet-stream');

    let thumbnailUrl = '';
    let thumbnailFileName = '';
    if (req.files.thumbnail) {
      const thumbFile = req.files.thumbnail[0];
      const thumbExt = path.extname(thumbFile.originalname).toLowerCase();
      thumbnailFileName = `projects/thumbnails/${uuidv4()}${thumbExt}`;
      thumbnailUrl = await uploadToBunny(thumbFile.buffer, thumbnailFileName, thumbFile.mimetype);
    }

    const project = new Project({
      title: title || fbxFile.originalname,
      description: description || '',
      fbxUrl,
      thumbnailUrl,
      fileName: fbxFileName,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/projects/:id
// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.fileName) await deleteFromBunny(project.fileName).catch(() => {});
    if (project.thumbnailUrl) {
      const thumbFileName = project.thumbnailUrl.replace(process.env.BUNNY_CDN_URL + '/', '');
      await deleteFromBunny(thumbFileName).catch(() => {});
    }
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;