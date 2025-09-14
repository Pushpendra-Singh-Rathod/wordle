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
app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

app.use((req, res, next) => {
  res.flash = (type, message) => {
    res.cookie("flash", JSON.stringify({ type, message }), {
      maxAge: 5000,
      httpOnly: true,
    });
  };

  if (req.cookies.flash) {
    try {
      const flash = JSON.parse(req.cookies.flash);
      res.locals[flash.type] = [flash.message]; // mimic req.flash behavior
    } catch (e) {
      res.locals.errors = [];
      res.locals.success = [];
    }
    res.clearCookie("flash");
  } else {
    res.locals.errors = [];
    res.locals.success = [];
  }

  next();
});

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
    res.flash("errors", "Passwords do not match!");
    return res.redirect("/register");
  }

  addUser(fullname, email, password, (err, userId) => {
    if (err) {
      console.error("❌ Error inserting user:", err.message);
      return res.status(500).send("Database error");
    }
    console.log(`✅ Success! User added with ID: ${userId}`);
    res.flash("success", "Registration successful! Please log in.");
    res.redirect("/login");
  });
});

app.post("/login", loginWithEmail);

app.get("/google", getLoginPage);
app.get("/google/callback", getLoginCallback);

app.listen(port, (req, res) => {
  console.log(`Listening at ${port}`);
});
