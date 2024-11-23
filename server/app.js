const express = require("express");
const axios = require("axios");
const session = require("express-session");
const path = require("path");
const bodyParser = require('body-parser');
const { limit, checkBanned } = require("../declaration/rateLimit.jsx");
const isAuthenticated = require("../declaration/autentikasi.jsx");
const TikWM = require("../pages/fitures/tiktok.js"); // Pastikan path ke TikWM.js sesuai

const app = express();

app.use(checkBanned);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'komtolllll',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 }
}));

/* !=== PAGE ===! */
app.get("/", limit, (req, res) => {
    res.sendFile(path.join(__dirname, "../pages/404.html"));
});

app.get("/login", limit, (req, res) => {
    res.sendFile(path.join(__dirname, "../pages/login.html"));
});

app.get("/profile", limit, isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "../pages/profile.html"));
});

/* = ENDPOINT FITURE = */
app.post('/register', (req, res) => {
    require("../declaration/register.jsx")(req, res);
});

app.post('/login', (req, res) => {
    require("../declaration/login.jsx")(req, res);
});

app.get("/logout", (req, res) => {
    require("../declaration/logout.jsx")(req, res);
});

app.get("/prof", isAuthenticated, (req, res) => {
    require("../declaration/profile.jsx")(req, res);
});

app.get("/blekbok", limit, async (req, res) => {
    require("../pages/fitures/blackbox.js")(req, res);
});

// Endpoint untuk fitur food
app.get("/nutrisi", limit, async (req, res) => {
  require("../pages/fitures/food.js")(req, res);
});

// Endpoint TikTok Downloader
app.get("/tiktokdl", limit, async (req, res) => {
    const { url, apiKey } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Url tidak ditemukan" });
    }
    if (!apiKey) {
        return res.status(403).json({ error: "API Key dibutuhkan" });
    }

    try {
        const result = await TikWM(url, apiKey);
        if (result.error) {
            return res.status(500).json({ error: result.error });
        }
        res.setHeader('Content-Type', 'text/plain'); // Mengatur header untuk respons berformat teks
        res.status(200).send(result.data); // Mengirim data dengan format string
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Terjadi kesalahan internal" });
    }
});

app.get("/instagramdl", limit, async (req, res) => {
    require("../pages/fitures/instagram.js")(req, res);
});

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, "../pages/404.html"));
});

module.exports = app;
