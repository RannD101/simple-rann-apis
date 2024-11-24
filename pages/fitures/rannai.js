const { GoogleGenerativeAI } = require("@google/generative-ai");
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

// API Key untuk Google Generative AI
const apiKeyGoogle = "AIzaSyA_Sz-G-gyrvI6J-OuYE-CDTuuWxQQjq6w";
const genAI = new GoogleGenerativeAI(apiKeyGoogle);

// Inisialisasi model generatif dengan instruksi sistem
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction: 
        "Kamu adalah Rann AI, asisten cerdas yang dirancang oleh RannD. Kamu berperan sebagai mitra percakapan yang ramah, sopan, dan informatif. Kamu mampu memahami konteks, beradaptasi dengan kebutuhan pengguna, dan memberikan jawaban yang relevan, kreatif, dan mudah dipahami. Kamu memiliki sifat empati dan bisa merespons dengan nada yang sesuai, baik itu serius, santai, atau humoris, tergantung pada permintaan pengguna. Pastikan setiap jawaban yang kamu berikan jelas, ringkas, dan memberikan nilai tambah bagi pengguna.",
});

// Fungsi untuk menangani endpoint /ai/rannai
module.exports = async (req, res) => {
    const { prompt, apiKey } = req.body;

    // Validasi API Key
    if (!apiKey) {
        return res.status(403).json({
            status: false,
            msg: "Input parameter 'apikey' diperlukan!",
        });
    }

    if (!allowedApiKeys.includes(apiKey)) {
        return res.status(403).json({
            status: false,
            msg: "Apikey tidak valid!",
        });
    }

    // Validasi prompt
    if (!prompt) {
        return res.status(400).json({
            status: false,
            msg: "Parameter 'prompt' tidak ditemukan!",
        });
    }

    try {
        // Menghasilkan respon dari AI
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Mengirimkan respon sukses
        return res.status(200).json({
            status: true,
            msg: "Success!",
            response: responseText,
        });
    } catch (error) {
        console.error("Error generating content:", error);

        // Respon jika terjadi kesalahan
        return res.status(500).json({
            status: false,
            msg: "Terjadi kesalahan dalam menghasilkan respon.",
            err: error.message,
        });
    }
};
