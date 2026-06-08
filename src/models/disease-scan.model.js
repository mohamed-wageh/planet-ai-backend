const mongoose = require('mongoose');

const diseaseScanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    governorate: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String, // هنحفظ فيها الـ Base64 زي ما اتفقنا
      required: true,
    },
    diseaseName: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
    },
    severity: {
      type: String,
    },
    isHealthy: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const DiseaseScan = mongoose.model('DiseaseScan', diseaseScanSchema);
module.exports = DiseaseScan;