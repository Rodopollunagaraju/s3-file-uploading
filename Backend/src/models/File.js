// backend/src/models/File.js
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileKey: {
    type: String,
    required: true,
    unique: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  folder: {
    type: String,
    default: 'root',
    trim: true
  },
  size: {
    type: Number,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedByEmail: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
fileSchema.index({ uploadedBy: 1, folder: 1 });
fileSchema.index({ fileKey: 1 });
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ contentType: 1 });

// Virtual for file extension
fileSchema.virtual('extension').get(function() {
  return this.fileName.split('.').pop();
});

// Static method to find user's files
fileSchema.statics.findByUser = function(userId, folder = null) {
  const query = { uploadedBy: userId };
  if (folder) {
    query.folder = folder;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to get user's storage usage
fileSchema.statics.getUserStorageSize = async function(userId) {
  const result = await this.aggregate([
    { $match: { uploadedBy: mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, totalSize: { $sum: '$size' }, count: { $sum: 1 } } }
  ]);
  
  return result.length > 0 ? result[0] : { totalSize: 0, count: 0 };
};

// Method to increment download count
fileSchema.methods.incrementDownload = async function() {
  this.downloadCount += 1;
  this.lastAccessed = new Date();
  return await this.save();
};

const File = mongoose.model('File', fileSchema);

module.exports = File;