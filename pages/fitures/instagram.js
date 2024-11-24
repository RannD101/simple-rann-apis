const axios = require("axios");

/**
 * Handler untuk fitur Instagram Downloader.
 * @param {Object} req - Request dari Express
 * @param {Object} res - Response dari Express
 */
module.exports = async (req, res) => {
    const { url, apiKey } = req.query; // Mendapatkan query string dari request

    // Validasi input
    if (!url) {
        return res.status(400).json({ error: "Url tidak ditemukan" });
    }
    if (!apiKey) {
        return res.status(403).json({ error: "API Key dibutuhkan" });
    }

    try {
        // Panggil API eksternal untuk mengambil data dari URL Instagram
        const response = await axios.get(`https://api.agatz.xyz/api/instagram`, {
            params: {
                url, // URL Instagram dari query
            },
        });

        // Cek apakah API eksternal memberikan respons error
        if (!response.data || response.data.error) {
            return res.status(500).json({
                error: "Gagal mengambil data dari API eksternal",
                details: response.data.error || "Tidak ada data yang diterima",
            });
        }

        // Berhasil mengambil data
        res.status(200).json({
            message: "Data berhasil diambil",
            data: response.data, // Data dari API eksternal
        });
    } catch (error) {
        console.error("Error Instagram API:", error.message || error);

        // Tangani kesalahan internal
        res.status(500).json({
            error: "Terjadi kesalahan internal",
            details: error.message || "Kesalahan tidak diketahui",
        });
    }
};
