const express = require("express");
const app = express();
const mongoose = require("mongoose");
const {Schema}=mongoose;
const bcrypt = require("bcrypt");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const methodOverride = require('method-override');
main()
  .then(() => {
    console.log("connected");
  })
  .catch((err) => console.log(err));
async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/FIRSTPRO");
}
app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "VERYBAD" }));
app.use(cookieParser());
app.use(methodOverride('_method'));
const userSchema = new Schema({
  username: {
      type: String,
      required: (true, "Please enter the username")
  },
  email: {
      type: String,
      required: (true, "Please enter the email address"),
      unique: true
  },
  password: {
      type: String,
      required: (true, "Please enter the password")
  },
})
const User=mongoose.model('USER',userSchema);
const leaderSchema = new Schema({
  teamname: {
      type: String,
      required: (true, "Please enter the team name")
  },
  username: {
      type: String,
      required: (true, "Please enter the username")
  },
  email: {
      type: String,
      required: (true, "Please enter the email address")
  },
  password: {
      type: String,
      required: (true, "Please enter the password")
  },
  users:[{
    type: Schema.Types.ObjectId,ref:'USER'
  }],
})
const Leader=mongoose.model('LEADER',leaderSchema);
const relog=(req,res,next)=>{
  if(!req.session.user_id)
    {
      return res.redirect("/login");
    }
    next();
}
app.get('/',(req,res)=>{
    res.render("main.ejs");
})
app.get('/register',(req,res)=>{
    res.render("register.ejs");
})
app.post('/register',async(req,res)=>{
  const{teamname,username,email,password}=req.body;
  const hash=await bcrypt.hash(password,6);
  const leader=new Leader({
    teamname:teamname,
    username:username,
    email:email,
    password:hash,
    users:[]
  })
  await leader.save();
  res.redirect('/login');
})
app.get('/login',(req,res)=>{
    res.render("login.ejs");
})
app.post('/login',async(req,res)=>{
  const{username,password}=req.body;
  const leader=await Leader.findOne({username});
  if(!leader)
    {
      return res.render("login.ejs");
    }
  const hashedpw=await bcrypt.compare(password,leader.password);
  if(!hashedpw)
    {
      return res.render("login.ejs");
    }
    req.session.user_id=leader._id;
  res.cookie("name", username);
  res.redirect('/leaderdash');
})
app.get('/leaderdash',relog, async (req,res)=>{
  // console.log(req.cookies.name);
  const fleader = await Leader.findOne({ username: req.cookies.name }).populate('users');
  // console.log(fleader);
  const allUsers= await fleader.users;
  // console.log(allUsers);
  res.render("leaderdash.ejs",{users: allUsers});
})
app.post('/leaderdash',(req,res)=>{
  res.redirect('/userdash');
})
app.get('/userdash',relog,(req,res)=>{
  res.render("userdash.ejs");
})
app.post('/userdash',async(req,res)=>{
  const {username,email,password}=req.body;
  const hash=await bcrypt.hash(password,6);
  const user=new User({
    username:username,
    email:email,
    password:hash,
  })
  await user.save();
  const userId = await User.findOne({ username })
  const add = await Leader.findOne({  username: req.cookies.name }).populate('users')
  add.users.push(userId._id)
  await add.save();
  res.redirect('/leaderdash');
})
app.delete('/deleteUser/:id',async (req,res) =>{
  const {id} = req.params;
  await User.findByIdAndDelete(id);
  const add = await Leader.findOne({ username: req.cookies.name }).populate('users')
  res.redirect('/leaderDash');
})
app.post('/logout', (req, res) => {
  req.session.user_id = null;
  res.redirect('/login')
})
app.listen(3000, () => {
    console.log("SERVING");
  });