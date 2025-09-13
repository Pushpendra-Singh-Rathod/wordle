const express = require("express");
const app = express();
const path = require("path");
const port = 3000;

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

app.get("/content", (req, res) => {
  try {
    res.render("content");
  } catch (error) {
    throw error;
  }
});

app.listen(port, (req, res) => {
  console.log(`Listening at ${port}`);
});
