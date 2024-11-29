const fetch = require("node-fetch");
const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const allowedApiKeys = require("../../declaration/arrayKey.jsx"); // Assuming allowed API keys are imported here

// Inisialisasi Google Generative AI dengan API Key
const genAI = new GoogleGenerativeAI("AIzaSyA_Sz-G-gyrvI6J-OuYE-CDTuuWxQQjq6w");
const model = genAI.getGenerativeModel({
  model: "models/gemini-1.5-pro",
  systemInstruction: "Kamu adalah asisten AI cerdas yang siap memberikan jawaban berdasarkan gambar dan teks.",
});

/**
 * Fungsi untuk mengunduh gambar dan mengonversinya ke format Base64.
 */
async function convertImageToBase64(imageUrl) {
  try {
    // Unduh gambar dari URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch image");
    }

    // Ambil gambar sebagai buffer
    const imageBuffer = await response.buffer();

    // Konversi buffer ke format Base64
    return imageBuffer.toString("base64");
  } catch (error) {
    throw new Error("Error converting image to Base64: " + error.message);
  }
}

module.exports = async (req, res) => {
  const { prompt, urlGambar, apiKey } = req.method === "POST" ? req.body : req.query;

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

  if (!prompt || !urlGambar) {
    return res.status(400).json({
      status: false,
      msg: "Parameter 'prompt' dan 'urlGambar' diperlukan!",
    });
  }

  try {
    // Convert image from URL to Base64
    const imageBase64 = await convertImageToBase64(urlGambar);

    // Kirim gambar dan teks pengguna ke AI
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg", // Assume image is JPEG, adjust accordingly
        },
      },
      prompt,
    ]);

    const generatedText = result.response.text();

    return res.status(200).json({
      status: true,
      msg: "Success!",
      response: generatedText,
    });
  } catch (error) {
    console.error("Error processing image:", error);

    return res.status(500).json({
      status: false,
      msg: "Terjadi kesalahan saat memproses gambar. Silakan coba lagi nanti.",
      err: error.message,
    });
  }
};
