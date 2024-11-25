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
        const response = await axios.get(`https://api.agatz.xyz/api/instagram`, {
            params: {
                url,
                apiKey,
            },
        });

        if (!response.data || response.data.error) {
            return res.status(500).json({
                error: "Gagal mengambil data dari API eksternal",
                details: response.data.error || "Tidak ada data yang diterima",
            });
        }

        res.status(200).json({
            message: "Data berhasil diambil",
            data: {
                status: 200,
                creator: "Rann",
                data: response.data.data,
            },
        });
    } catch (error) {
        console.error("Error Instagram API:", error.message || error);

        res.status(500).json({
            error: "Terjadi kesalahan internal",
            details: error.message || "Kesalahan tidak diketahui",
        });
    }
};
