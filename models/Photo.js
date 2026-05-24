const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  url: { type: String, required: true },       // Bunny CDN URL
  fileName: { type: String, required: true },  // file name on Bunny storage
  category: { type: String, default: 'general' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Photo', photoSchema);