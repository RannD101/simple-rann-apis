const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKeyGoogle = "AIzaSyA_Sz-G-gyrvI6J-OuYE-CDTuuWxQQjq6w";
const genAI = new GoogleGenerativeAI(apiKeyGoogle);

const sessionDir = path.join("/tmp", "sessions");

// Membuat folder sesi jika belum ada
if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction:
        "Kamu adalah Rann AI, asisten cerdas yang dirancang oleh RannD. Kamu berperan sebagai mitra percakapan yang ramah, sopan, dan informatif.",
});

// Fungsi untuk membaca sesi dari file
const readSession = (sessionId) => {
    try {
        const filePath = path.join(sessionDir, `${sessionId}.json`);
        if (!fs.existsSync(filePath)) return null;
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading session:", err);
        return null;
    }
};

// Fungsi untuk menyimpan sesi ke file
const saveSession = (sessionId, sessionData) => {
    try {
        const filePath = path.join(sessionDir, `${sessionId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(sessionData, null, 2), "utf-8");
    } catch (err) {
        console.error("Error saving session:", err);
    }
};

// Fungsi untuk menghapus sesi lama
const cleanupSessions = () => {
    const now = Date.now();
    const threeHours = 3 * 60 * 60 * 1000;
    fs.readdirSync(sessionDir).forEach((file) => {
        const filePath = path.join(sessionDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > threeHours) {
            fs.unlinkSync(filePath);
        }
    });
};

module.exports = async (req, res) => {
    const { sessionId, prompt } = req.body;

    // Validasi parameter
    if (!sessionId || !/^[a-zA-Z0-9]{8,32}$/.test(sessionId)) {
        return res.status(400).json({
            status: false,
            msg: "Session ID tidak valid! Harus alphanumeric dan panjang 8-32 karakter.",
        });
    }

    if (!prompt) {
        return res.status(400).json({
            status: false,
            msg: "Parameter 'prompt' tidak ditemukan!",
        });
    }

    try {
        // Baca sesi sebelumnya
        const sessionData = readSession(sessionId) || { messages: [] };

        // Tambahkan prompt baru ke riwayat
        sessionData.messages.push({ role: "user", content: prompt });

        // Batasi riwayat ke 10 pesan terakhir
        sessionData.messages = sessionData.messages.slice(-10);

        // Buat `systemInstruction` yang berisi riwayat sebelumnya
        const systemInstruction = sessionData.messages
            .map((msg) => `${msg.role === "user" ? "Pengguna" : "AI"}: ${msg.content}`)
            .join("\n");

        const result = await model.generateContent({
            prompt: `${systemInstruction}\n\nAI:`,
        });

        const responseText = result.response.text();

        // Simpan respons AI ke sesi
        sessionData.messages.push({ role: "assistant", content: responseText });
        saveSession(sessionId, sessionData);

        // Bersihkan sesi lama
        cleanupSessions();

        return res.status(200).json({
            status: true,
            msg: "Success!",
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
