const mongoose = require('mongoose');

// Define the PostSchema
const PostSchema = new mongoose.Schema({
  image: {
    type: String
  },
  caption: {
    type: String
  },
  description: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference to a User model if applicable
  },
  date: {
    type: Date,
    default: Date.now
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    comment: String
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }]
});

// Create a model using the PostSchema
const Post = mongoose.model('Post', PostSchema);
module.exports = Post;
