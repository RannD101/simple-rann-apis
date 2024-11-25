const express = require("express");
const axios = require("axios");
const session = require("express-session");
const path = require("path");
const bodyParser = require('body-parser');
const { limit, checkBanned } = require("../declaration/rateLimit.jsx");
const isAuthenticated = require("../declaration/autentikasi.jsx");
const TikWM = require("../pages/fitures/tiktok.js"); // Pastikan path ke TikWM.js sesuai

const app = express();

app.set('json spaces', 2);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
    res.sendFile(path.join(__dirname, "../pages/home.html"));
});

app.get("/dl", limit, (req, res) => {
    res.sendFile(path.join(__dirname, "../pages/dl.html"));
});

app.get("/random", limit, (req, res) => {
    res.sendFile(path.join(__dirname, "../pages/random.html"));
});

app.get("/ai", limit, (req, res) => {
    res.sendFile(path.join(__dirname, "../pages/ai.html"));
});

app.get("/tools", limit, (req, res) => {
    res.sendFile(path.join(__dirname, "../pages/tools.html"));
});

app.get("/ai/rannai", limit, async (req, res) => {
    require("../pages/fitures/rannai.js")(req, res);
});

// Endpoint untuk fitur food
app.get("/random/nutrisi", limit, async (req, res) => {
  require("../pages/fitures/food.js")(req, res);
});

app.get("/random/spotifySearch", limit, async (req, res) => {
  require("../pages/fitures/spotify.js")(req, res);
});

// Endpoint TikTok Downloader
app.get("/dl/tiktokdl", limit, async (req, res) => {
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

app.get("/dl/instagramdl", async (req, res) => {
    require("../pages/fitures/instagram.js")(req, res);
});

app.get("/dl/threadsdl", async (req, res) => {
    require("../pages/fitures/thread.js")(req, res);
});

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, "../pages/home.html"));
});

module.exports = app;
