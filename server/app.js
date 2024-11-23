const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const { limit, checkBanned } = require("../declaration/rateLimit.jsx");
const isAuthenticated = require("../declaration/autentikasi.jsx");

// Inisialisasi aplikasi Express
const app = express();

// Middleware global
app.use(checkBanned);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "komtolllll", // Gunakan secret yang lebih aman untuk produksi
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }, // 1 jam
  })
);

/* === Rute Halaman === */
app.get("/", limit, (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/404.html"));
});

app.get("/login", limit, (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/login.html"));
});

app.get("/profile", limit, isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "../pages/profile.html"));
});

/* === Rute Endpoint Fitur === */
app.post("/register", (req, res) => {
  const registerHandler = require("../declaration/register.jsx");
  registerHandler(req, res);
});

app.post("/login", (req, res) => {
  const loginHandler = require("../declaration/login.jsx");
  loginHandler(req, res);
});

app.get("/logout", (req, res) => {
  const logoutHandler = require("../declaration/logout.jsx");
  logoutHandler(req, res);
});

app.get("/prof", isAuthenticated, (req, res) => {
  const profileHandler = require("../declaration/profile.jsx");
  profileHandler(req, res);
});

/* === Rute Fitur Unduhan === */
app.get("/blekbok", limit, async (req, res) => {
  const blackboxHandler = require("../pages/fitures/blackbox.js");
  await blackboxHandler(req, res);
});

app.get("/tiktokdl", limit, async (req, res) => {
  const tiktokHandler = require("../pages/fitures/tiktok.js");
  await tiktokHandler(req, res);
});

app.get("/instagramdl", limit, async (req, res) => {
  const instagramHandler = require("../pages/fitures/instagram.js");
  await instagramHandler(req, res);
});

/* === Penanganan 404 === */
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "../pages/404.html"));
});

module.exports = app;