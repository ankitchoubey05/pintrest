const mongoose = require('mongoose');

// Define the PostSchema
const commentSchema = new mongoose.Schema({
 
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference to a User model if applicable
  },
  date: {
    type: Date,
    default: Date.now
  },
 
  comments:String,
});

// Create a model using the PostSchema
const Post = mongoose.model('Comment', commentSchemaSchema);
module.exports = Comment;
