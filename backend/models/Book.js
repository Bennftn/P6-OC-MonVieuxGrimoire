const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true },
  ratings: [{
    userId: { type: String, required: true },
    grade: { type: Number, required: true, min: 0, max: 5 }
  }],
  averageRating: { type: Number, default: 0, min: 0, max: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
