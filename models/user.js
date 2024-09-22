const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/miniproject1');

const userSchema = new mongoose.Schema({
  username: String,
  name: String,
  age: Number,
  email: String,
  password: String,
  profilepic: {
    type: String,
    default: "default.webp",
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post", // Change to "Post" to match the post model
    },
  ],
});

module.exports = mongoose.model('User', userSchema);
