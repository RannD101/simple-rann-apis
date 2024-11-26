const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Konfigurasi GoogleGenerativeAI
const apiKeyGoogle = "AIzaSyA_Sz-G-gyrvI6J-OuYE-CDTuuWxQQjq6w";
const genAI = new GoogleGenerativeAI(apiKeyGoogle);

// Direktori sesi
const sessionsDir = path.join("/tmp", "sessions");

// Membuat folder sesi jika belum ada
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

// Hapus sesi lama secara otomatis (3 jam)
setInterval(() => {
    const files = fs.readdirSync(sessionsDir);
    const now = Date.now();
    files.forEach((file) => {
        const filePath = path.join(sessionsDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > 3 * 60 * 60 * 1000) {
            fs.unlinkSync(filePath);
        }
    });
}, 60 * 60 * 1000); // Periksa setiap 1 jam

module.exports = async (req, res) => {
    const { prompt, sessionId } = req.method === "POST" ? req.body : req.query;

    // Validasi sessionId
    if (!sessionId || !/^[a-zA-Z0-9]{8,32}$/.test(sessionId)) {
        return res.status(400).json({
            status: false,
            msg: "Session ID tidak valid! Harus alphanumeric dan panjang 8-32 karakter.",
        });
    }

    const sessionFile = path.join(sessionsDir, `${sessionId}.json`);

    // Validasi prompt
    if (!prompt) {
        return res.status(400).json({
            status: false,
            msg: "Parameter 'prompt' tidak ditemukan!",
        });
    }

    try {
        // Memuat sesi jika ada
        let sessionData = {};
        if (fs.existsSync(sessionFile)) {
            sessionData = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
        }

        // Menyiapkan instruksi sistem dengan riwayat
        const systemInstruction = 
            "Kamu adalah Rann AI, asisten cerdas yang dirancang oleh RannD. " +
            "Kamu berperan sebagai mitra percakapan yang ramah, sopan, dan informatif. " +
            (sessionData.lastResponse ? `Riwayat terakhir: ${sessionData.lastResponse}` : "");

        // Memperbarui model dengan instruksi sistem
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction,
        });

        // Generate response dari AI
        const result = await model.generateContent(prompt);

        // Periksa apakah `candidates` tersedia dan tidak kosong
        const responseText = result.candidates?.[0]?.content || "Tidak ada respon dari AI.";

        // Simpan sesi baru
        sessionData.lastPrompt = prompt;
        sessionData.lastResponse = responseText;
        sessionData.updatedAt = new Date().toISOString();
        fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));

        // Kirim response
        return res.status(200).json({
            status: true,
            msg: "Success!",
            session: sessionId,
            response: responseText,
        });
    } catch (error) {
        console.error("Error generating content:", error);

        return res.status(500).json({
            status: false,
            msg: "Terjadi kesalahan dalam menghasilkan respon.",
            response: error.message,
        });
    }
};
