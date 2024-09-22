const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Change to "User" to match the user model
  },
  date: {
    type: Date,
    default: Date.now,
  },
  content: String,
  likes: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Change to "User" for consistency
  ],
});

module.exports = mongoose.model('Post', postSchema); // Change to "Post" to match the model name
