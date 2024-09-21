const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const path=require('path')
const userModel=require('./models/user');
const cookieParser = require('cookie-parser');
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const postModel=require('./models/post')
const crypto = require('crypto');
const multerconfig=require("./config/multerconfig");
const upload = require('./config/multerconfig');

app.set("view engine","ejs")
app.use(express.static(path.join(__dirname, 'public')))

app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(cookieParser())



app.get('/',(req,res)=>{
  res.render("index")
})


app.get('/profile/upload',(req,res)=>{
  res.render("profileupload");
})

app.post('/upload', isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });

    if (req.file) {
      user.profilepic = req.file.filename; 
      await user.save();
      res.redirect("/profile");
    } else {
      res.status(400).send("No file uploaded.");
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).send("Error uploading file.");
  }
});




app.post('/register', async (req,res)=>{
  let {email,password,username,name,age} =req.body;

  let user=await userModel.findOne({email})
  if(user) return res.status(500).send("User Already Registered")

   bcrypt.genSalt(10,(err,salt)=>{
    bcrypt.hash(password,salt, async (err,hash)=>{
      let user= await userModel.create({
        username,
        email,
        age,
        name,
        password:hash
      });
      let token = jwt.sign({email:email,userid : user._id}, "shhh")
      res.cookie('token',token)
      res.send("Registered")
    }) 
})
})

app.post('/login', async (req,res)=>{
  let {email,password} =req.body;

  let user=await userModel.findOne({email})
  if(!user) return res.status(500).send("Something Went Wrong")

    bcrypt.compare(password,user.password,function (err,result){
      if(result)
        {
          let token = jwt.sign({email:email,userid : user._id}, "shhh")
          res.cookie('token',token)
          return res.status(200).redirect("profile")
         
        }
      else res.redirect('/login')
    })

})

app.get('/profile', isLoggedIn, async (req, res) => {
  const user = await userModel.findOne({ email: req.user.email }).populate('posts');
  if (!user) {
    return res.status(404).send('User not found');
  }
  res.render('profile', { user });
});

app.get('/like/:id', isLoggedIn, async (req, res) => {

  let post =await postModel.findOne({_id: req.params.id}).populate("user");
  if(post.likes.indexOf(req.user.userid)===-1){
  post.likes.push(req.user.userid);
  }
  else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1);
  }
 
  await post.save();
  res.redirect('/profile');
});

app.get('/edit/:id', isLoggedIn, async (req, res) => {

  let post =await postModel.findOne({_id: req.params.id}).populate("user");
  res.render("edit",{post});
});

app.post('/update/:id', isLoggedIn, async (req, res) => {
  let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});
  const user = await userModel.findOne({ email: req.user.email }).populate('posts');
  res.render('profile', { user });
});

app.post('/delete/:id', isLoggedIn, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await postModel.findByIdAndDelete(postId);

    if (!post) {
      return res.status(404).send('Post not found');
    }

    await userModel.updateOne({ _id: post.user }, { $pull: { posts: postId } });

    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting post');
  }
});



app.post('/post',isLoggedIn, async (req,res)=>{
  let user = await userModel.findOne({email : req.user.email });
  let { content } =req.body;
  let post =await postModel.create({
    user: user._id,
    content
  });
  user.posts.push(post._id)
  await user.save();
  res.redirect("/profile")
  })

app.get('/login',(req,res)=>{
  res.render("login")
})

app.get('/logout',(req,res)=>{
  res.cookie("token","")
  res.redirect('/login')
})

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/login'); // No token found, redirect to login
  }

  try {
    const data = jwt.verify(token, "shhh");
    req.user = data; // Save the decoded token data to `req.user`
    next(); // Token is valid, proceed to the next middleware or route
  } catch (err) {
    console.error("Token verification error:", err);
    res.redirect('/login'); // Token invalid or expired, redirect to login
  }
}


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});