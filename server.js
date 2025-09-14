require("dotenv").config();
const cookieParser = require("cookie-parser");
const { addUser } = require("./schema.js");
const {
  getLoginPage,
  getLoginCallback,
  loginWithEmail,
} = require("./authServer.js");
const express = require("express");
const app = express();
const path = require("path");
const port = process.env.PORT || 3000;
const session = require("express-session");
const flash = require("connect-flash");

app.use(
  session({
    secret: "your-secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.errors = req.flash("errors");
  res.locals.success = req.flash("success");
  next();
});


app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (req, res) => {
  try {
    res.render("index");
  } catch (error) {
    throw error;
  }
});

app.get("/login", (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    throw error;
  }
});

app.get("/content", (req, res) => {
  try {
    res.render("content");
  } catch (error) {
    throw error;
  }
});

app.get("/register", (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    throw error;
  }
});

app.post("/register", (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render("register", { error: "Passwords do not match!" });
  }

  addUser(fullname, email, password, (err, userId) => {
    if (err) {
      console.error("❌ Error inserting user:", err.message);
      return res.status(500).send("Database error");
    }
    console.log(`✅ Success! User added with ID: ${userId}`);
    res.redirect("/content");
  });
});

app.post("/login", loginWithEmail);

app.get("/google", getLoginPage);
app.get("/google/callback", getLoginCallback);

app.listen(port, (req, res) => {
  console.log(`Listening at ${port}`);
});
