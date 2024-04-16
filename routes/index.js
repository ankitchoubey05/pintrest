var express = require('express');
var router = express.Router();
const usermodel=require('./users');
const passport=require("passport");
var GoogleStrategy = require('passport-google-oidc');
const localstrategy=require('passport-local');
const {upload}=require("./multer")
const postmodel=require("./posts")
const {dpupload}=require("./multer")
require('dotenv').config();



passport.use(new localstrategy(usermodel.authenticate()))


router.get('/username/:username',isloggedIn,async function(req, res, next) {
  const regex = new RegExp(`^${req.params.username}`, 'i');
  const user=await usermodel.find({
    username:regex
  })
  res.json(user)
});

/* for sign up */
router.get('/signup', function(req, res, next) {
  res.render('signup');
});


router.get('/post',isloggedIn, function(req, res, next) {
  // console.log(req.flash("error"));
  res.render("post2");
});


router.get('/feed', isloggedIn,async function(req, res, next) {
//  const user=await usermodel.findOne({username:req.session.passport.user}).populate("posts");
const user = await usermodel.findOne({ username: req.session.passport.user }).populate("posts")

// console.log(user,"detail")

 res.render('feed',{user:user});
});





router.get('/loginpage', function(req, res, next) {
  // console.log(req.flash("error"));
  res.render('loginpage',{error:req.flash("error")});
});

// multer started here
router.post('/upload',isloggedIn,upload.single('file'),async (req,res)=>{
  if(!req.file) {
    return res.status(400).send("no files were uploaded")
  }
  const user=await usermodel.findOne({username:req.session.passport.user});
  const post= await postmodel.create({
    image:req.file.filename,
    caption:req.body.caption,
    Discription:req.body.Discription,
    user:user._id,
  })

  user.posts.push(post._id)
  await user.save();

  res.redirect("/feed")
})


/* for dpside */

router.post("/dpimage",isloggedIn,dpupload.single('file'),async(req,res)=>{
  if(!req.file){
   return res.status(400).send("no files were uploaded")

  }
  const user=await usermodel.findOne({username:req.session.passport.user});/* phale dekha ki konsa user h  */
  user.imagedp=req.file.filename
  await user.save();
  res.redirect("/feed")
})


/* for home page */

router.get('/profile',isloggedIn,async function(req, res, next) {
 const user=await usermodel.findOne({username:req.session.passport.user})
  const posts=await postmodel.find().populate("user") ;
  // console.log(posts,"from profile side")
  res.render("profile",{user,posts,nav:true})

  
});

router.post('/register', function(req, res, next) {
  const userdetails = new usermodel({
    username: req.body.username, // Make sure req.body.username is a string
    name: req.body.name,
    email: req.body.email,
  });

  usermodel.register(userdetails, req.body.password, function(err, user) {
    if (err) {
      console.error(err);
      return res.status(500).send("Error in registration");
    }
    passport.authenticate("local")(req, res, function() {
      res.redirect('/profile');
    });
  });
});

router.post('/login',passport.authenticate('local',{
  successRedirect:'/profile',
  failureRedirect:'/',
  failureFlash:true,
}),function(req,res,next){});

router.get('/logout',function(req,res,next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})


function isloggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    res.redirect('/loginpage');
  }
}


/* GET home page.  index==sign page*/

router.get('/', function(req, res, next) {
  res.render('index');
});

/* google login  */
// router.get('/login/federated/google', passport.authenticate('google'));
router.get('/login/federated/google', function(req, res, next) {
  // Include the prompt parameter to force the account selection
  passport.authenticate('google', { prompt: 'select_account' })(req, res, next);
});

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/profile',
  failureRedirect: '/'
}));
passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: [ 'profile', 'email' ]
}, async function verify(issuer, profile, cb) {
  try {
    let username;

    // Check if profile name is available and is a string
    if (profile.name && typeof profile.name === 'string') {
      username = profile.name;
    } else if (profile.name && typeof profile.name === 'object') {
      // If profile name is an object, concatenate familyName and givenName
      username = profile.name.familyName + profile.name.givenName;
    } else {
      // Fallback to email if username is not available
      username = profile.emails[0].value;
    }

    // Check if the user already exists in the database
    let user = await usermodel.findOne({ email: profile.emails[0].value });

    if (!user) {
      // If user does not exist, create a new one
      user = await usermodel.create({ username: username, email: profile.emails[0].value });
    }

    // Return the user to passport
    return cb(null, user);
  } catch (error) {
    return cb(error);
  }
}));

/* user search here  */

router.get("/username/:inputvalue",isloggedIn,async (req,res,next)=>{
  const regex = new RegExp(`^${req.body.username}`, 'i');
  const user=await usermodel.find({username:regex})
  res.json(user)
  

})

router.post('/username', isloggedIn, async function (req, res, next) {
  try {
      
    const users = await usermodel.find({ username: regex });
    res.json(users);
  } catch (error) {
    console.error("Error in search route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


/* after search user and clik on it to go profile view */
router.get('/postprofile/:postid',isloggedIn, async function (req, res, next) {
  let user = await usermodel.findOne({username:req.session.passport.user})

  let poster = await usermodel.findOne({_id:req.params.postid}).populate("posts")
  console.log(poster)
  // res.send("hello")
  res.render("postprofile",{poster,user,error:req.flash("error")})
});


router.get( '/viewpost/:postid',isloggedIn,async (req,res,next)=>{
  let user = await usermodel.findOne({username:req.session.passport.user})
  let post = await postmodel.findOne({_id:req.params.postid}).populate("user")
  .populate({path:'comments',populate:{path:"User"}
})
   
res.render('viewpost', { user, post });
})




router.post('/follow/:postid', isloggedIn, async function (req, res, next) {
  try {
    // Find the logged-in user
    let user = await usermodel.findOne({ username: req.session.passport.user });

    // Find the author of the post
    let postAuthor = await usermodel.findById(req.params.postid);

    // Check if the logged-in user is already following the post author
    if (!user.followings.includes(postAuthor._id)) {
      // If not following, add the post author to the user's followings list
      user.followings.push(postAuthor._id);
      await user.save();

      // Add the logged-in user to the post author's followers list
      postAuthor.followers.push(user._id);
      await postAuthor.save();

      // Increment the followers count for the post author
      postAuthor.followersCount += 1;
      await postAuthor.save();

      return res.json({ message: "Followed successfully", followersCount: postAuthor.followersCount });
    } else {
      return res.json({ message: "Already following", followersCount: postAuthor.followersCount });
    }
  } catch (error) {
    console.error("Error in follow route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

router.post('/unfollow/:postid', isloggedIn, async function (req, res, next) {
  try {
    // Find the logged-in user
    let user = await usermodel.findOne({ username: req.session.passport.user });

    // Find the author of the post
    let postAuthor = await usermodel.findById(req.params.postid);

    // Check if the post author is found
    if (!postAuthor) {
      console.error("Post author not found for post ID:", req.params.postid);
      return res.status(404).send("Post author not found");
    }

    // Check if the logged-in user is already following the post author
    const followingIndex = user.followings.indexOf(postAuthor._id);
    if (followingIndex !== -1) {
      // If following, remove the post author from the user's followings list
      user.followings.splice(followingIndex, 1);
      await user.save();

      // Remove the logged-in user from the post author's followers list
      const followerIndex = postAuthor.followers.indexOf(user._id);
      if (followerIndex !== -1) {
        postAuthor.followers.splice(followerIndex, 1);
        await postAuthor.save();
      }

      // Decrement the followers count for the post author
      postAuthor.followersCount -= 1;
      await postAuthor.save();

      return res.json({ message: "Unfollowed successfully", followersCount: postAuthor.followersCount });
    } else {
      return res.json({ message: "You are not following this user", followersCount: postAuthor.followersCount });
    }
  } catch (error) {
    console.error("Error in unfollow route:", error);
    return res.status(500).send("Internal Server Error");
  }
});

/* for comment on a post */
// Route for submitting a new comment
router.post('/post/:postId/comment', async (req, res) => {
  try {
    const postId = req.params.postId;
    const { comment } = req.body;

    // Find the post by ID
    const post = await postmodel.findById(postId);

  

    // Add the new comment to the post
    post.comments.push({ user: req.user.id, comment });
    await post.save();

    // Send back the updated list of comments
    res.json({ comments: post.comments });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
/* for like button */
// Route for liking or unliking a post
router.post('/post/:postId/like', async (req, res) => {
  try {
    const postId = req.params.postId;
    // Find the post by ID
    const post = await postmodel.findById(postId);
    
    // Check if the user has already liked the post
    const userLikedIndex = post.likes.indexOf(req.user.id);
    if (userLikedIndex !== -1) {
      // If user has already liked the post, remove their like
      post.likes.splice(userLikedIndex, 1);
    } else {
      // If user hasn't liked the post, add their like
      post.likes.push(req.user.id);
    }

    await post.save();
    // Send back the updated number of likes and the current user's like status
    res.json({ likes: post.likes.length, userLiked: userLikedIndex !== -1 });
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


module.exports = router;