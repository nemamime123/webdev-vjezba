//jshint esversion:6

const express = require("express"); //npm i express
const bodyParser = require("body-parser"); //npm i body-parser
const ejs = require("ejs"); //npm i ejs
const mongoose = require("mongoose"); //npm i mongoose
const session = require("express-session"); //npm express-session
const passport = require("passport"); //npm i passport
const passportLocalMongoose = require("passport-local-mongoose"); //npm i passport-local passport-local-mongoose
const GoogleStrategy = require("passport-google-oauth20").Strategy; //npm install passport-google-oauth20
const findOrCreate = require("mongoose-findorcreate"); //npm i mongoose-findorcreate

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/UserDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://googleleapis.com/oauth20/v3/userinfo" //probaj ovo komentirat kad sve radi
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.route("/")
.get(function(req, res) {
  res.render("home");
});

app.route("/register")
.get(function(req, res) {
  res.render("register"); //ovo ejs "komanda"
})
.post(function(req, res) {

  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    }
    else {
      passport.authenticate("local") (req, res, function() { //funkcija ce se triggerati samo ako je autentikacija uspjesna
        res.redirect("/secrets");
      })
    }
  })
});

app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  }
  else {
    res.redirect("/login");
  }
});

app.route("/login")
.get(function(req, res) {
  res.render("login");
})
.post(function(req, res) {

  const user = new User ({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    }
    else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });
    }
  });

});

app.route("/logout")
.get(function(req, res) {
  req.logout();
  res.redirect("/");
});

app.listen(3000, function() {
  console.log("Server started.");
});
