//jshint esversion:6

const express = require("express"); //npm i express
const bodyParser = require("body-parser"); //npm i body-parser
const ejs = require("ejs"); //npm i ejs
const mongoose = require("mongoose"); //npm i mongoose
const bcrypt = require("bcrypt"); //npm i bcrypt
const saltRounds = 10; //broj salt-anja

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.route("/")
.get(function(req, res) {
  res.render("home");
});

app.route("/register")
.get(function(req, res) {
  res.render("register"); //ovo ejs "komanda"
})
.post(function(req, res) {

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const newUser = new User({
      //sve ispod je mongoose "komanda"
      email: req.body.username,
      password: hash //odnosi se na ovo u funkciji iznad
    });
    newUser.save(function(err) {
      if (err) {
        console.log(err);
      }
      else {
        res.render("secrets");
      }
    });
  });
});

app.route("/login")
.get(function(req, res) {
  res.render("login");
})
.post(function(req, res) {

  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email: username}, function(err, foundUser) {
    if (err) {
      console.log(err);
    }
    else {
      if (foundUser) {
        //ovo usporeduje plain text password i hash password
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if (result == true) {
            res.render("secrets");
          }
        });
      }
    }
  });
});

mongoose.connect("mongodb://localhost:27017/UserDB", { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

const User = new mongoose.model("User", userSchema);

app.listen(3000, function() {
  console.log("Server started.");
});
