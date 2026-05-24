const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  fbxUrl: { type: String, required: true },      // Bunny CDN URL for FBX file
  thumbnailUrl: { type: String, default: '' },   // Bunny CDN URL for preview image
  fileName: { type: String, required: true },    // file name on Bunny storage
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);