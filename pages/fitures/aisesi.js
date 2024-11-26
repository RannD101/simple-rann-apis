const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Konfigurasi GoogleGenerativeAI
const apiKeyGoogle = "AIzaSyA_Sz-G-gyrvI6J-OuYE-CDTuuWxQQjq6w";
const genAI = new GoogleGenerativeAI(apiKeyGoogle);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction: "Kamu adalah Rann AI, asisten cerdas yang dirancang oleh RannD. Kamu berperan sebagai mitra percakapan yang ramah, sopan, dan informatif. Kamu mampu memahami konteks, beradaptasi dengan kebutuhan pengguna, dan memberikan jawaban yang relevan, kreatif, dan mudah dipahami. Kamu memiliki sifat empati dan bisa merespons dengan nada yang sesuai, baik itu serius, santai, atau humoris, tergantung pada permintaan pengguna. Pastikan setiap jawaban yang kamu berikan jelas, ringkas, dan memberikan nilai tambah bagi pengguna.",
});

// Direktori untuk menyimpan sesi
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
        // Muat riwayat sesi
        let sessionData = { history: [] };
        if (fs.existsSync(sessionFile)) {
            sessionData = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
        }

        // Tambahkan riwayat ke system instruction
        const historyText = sessionData.history
            .map((entry) => `User: ${entry.prompt}\nRann AI: ${entry.response}`)
            .join("\n\n");

        const extendedSystemInstruction = `Konteks percakapan sebelumnya:\n${historyText}\n\nKamu adalah Rann AI, asisten cerdas yang dirancang oleh RannD. Kamu berperan sebagai mitra percakapan yang ramah, sopan, dan informatif. Kamu mampu memahami konteks, beradaptasi dengan kebutuhan pengguna, dan memberikan jawaban yang relevan, kreatif, dan mudah dipahami.`;

        const contextualModel = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: extendedSystemInstruction,
        });

        // Generate response dari AI
        const result = await contextualModel.generateContent(prompt);

        if (!result || !result.candidates || result.candidates.length === 0) {
            throw new Error("AI tidak menghasilkan respon.");
        }

        const responseText = result.candidates[0].content;

        // Simpan sesi baru
        sessionData.history.push({
            prompt: prompt,
            response: responseText,
            timestamp: new Date().toISOString(),
        });

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
