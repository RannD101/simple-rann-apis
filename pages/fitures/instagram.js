const axios = require("axios");

module.exports = async (req, res) => {
    console.log("Query received:", req.query); // Debug log

    const { url, apiKey } = req.query || {};

    if (!url) {
        return res.status(400).json({ error: "Url tidak ditemukan", details: req.query });
    }
    if (!apiKey) {
        return res.status(403).json({ error: "API Key dibutuhkan", details: req.query });
    }

    try {
        const response = await axios.get(`https://api.agatz.com/instagram?url=${encodeURIComponent(url)}`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error(error.message); // Debug log
        res.status(500).json({ error: "Terjadi kesalahan saat mengambil data Instagram", details: error.message });
    }
};
