const mongoose = require('mongoose');
const { isEmail } = require('validator');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [isEmail, 'Email invalide'],
  },
  password: { type: String, required: true, minlength: 8 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
