const mongoose = require('mongoose');
const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  fbxUrl: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Project', projectSchema);