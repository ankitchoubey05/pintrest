const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/pintrestuserData");

const userSchema = mongoose.Schema({
  name: { type: String },
  username: { type: String },
  email: { type: String },
  password: { type: String },
  followings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
 
  imagedp: { type: String, default: 'default.jpg' },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
});

userSchema.plugin(plm);
module.exports = mongoose.model('User', userSchema);
