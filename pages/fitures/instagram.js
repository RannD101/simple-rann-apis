const axios = require("axios");

module.exports = async (req, res) => {
    const { url, apiKey } = req.query;

    if (!url) {
        return res.status(400).json({ error: "Url tidak ditemukan" });
    }
    if (!apiKey) {
        return res.status(403).json({ error: "API Key dibutuhkan" });
    }

    try {
        // Pastikan menggunakan API yang benar, misalnya api.agatz
        const response = await axios.get(`https://api.agatz.com/instagram?url=${encodeURIComponent(url)}`);

        if (response.data) {
            res.setHeader('Content-Type', 'application/json'); // Mengatur header untuk respons JSON
            res.status(200).json(response.data); // Mengirimkan data yang diterima dari API
        } else {
            res.status(404).json({ error: "Data tidak ditemukan" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Terjadi kesalahan saat mengambil data Instagram" });
    }
};
