const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyA_Sz-G-gyrvI6J-OuYE-CDTuuWxQQjq6w"; // Ganti dengan API key Anda
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction:
    "Kamu adalah Rann AI, asisten cerdas yang dirancang oleh RannD. Kamu berperan sebagai mitra percakapan yang ramah, sopan, dan informatif. Kamu mampu memahami konteks, beradaptasi dengan kebutuhan pengguna, dan memberikan jawaban yang relevan, kreatif, dan mudah dipahami. Kamu memiliki sifat empati dan bisa merespons dengan nada yang sesuai, baik itu serius, santai, atau humoris, tergantung pada permintaan pengguna. Pastikan setiap jawaban yang kamu berikan jelas, ringkas, dan memberikan nilai tambah bagi pengguna.",
});

/**
 * Fungsi untuk menghasilkan teks menggunakan Google Generative AI
 * @param {string} prompt - Teks permintaan pengguna
 * @param {string} apikey - API key pengguna untuk validasi
 * @returns {Promise<{status: boolean, data?: string, msg?: string}>} - Hasil respons dari model
 */
const generateResponse = async (prompt, apikey) => {
  try {
    const allowedApiKeys = require("../../declaration/arrayKey.jsx");

    // Validasi API key
    if (!allowedApiKeys.includes(apikey)) {
      return { status: false, msg: "API key tidak valid atau tidak ditemukan." };
    }

    // Validasi prompt
    if (!prompt || typeof prompt !== "string") {
      return { status: false, msg: "Prompt tidak valid. Harap masukkan teks permintaan yang benar." };
    }

    // Menghasilkan respons
    const result = await model.generateContent(prompt);
    return { status: true, data: result.response.text() };
  } catch (error) {
    console.error("Error generating content:", error);
    return { status: false, msg: "Gagal menghasilkan respon. Silakan coba lagi." };
  }
};

module.exports = generateResponse;
