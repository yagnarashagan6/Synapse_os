const mongoose = require('mongoose');

const competitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  scrapedData: {
    type: mongoose.Schema.Types.Mixed, // Storing flexible structure from Apify
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Competitor', competitorSchema);
