const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

const apiKeyGoogle = "AIzaSyA_Sz-G-gyrvI6J-OuYE-CDTuuWxQQjq6w";
const genAI = new GoogleGenerativeAI(apiKeyGoogle);

const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    systemInstruction: 
        "Kamu adalah Rann AI, asisten cerdas yang dirancang oleh RannD. Kamu berperan sebagai mitra percakapan yang ramah, sopan, dan informatif. Kamu mampu memahami konteks, beradaptasi dengan kebutuhan pengguna, dan memberikan jawaban yang relevan, kreatif, dan mudah dipahami. Kamu memiliki sifat empati dan bisa merespons dengan nada yang sesuai, baik itu serius, santai, atau humoris, tergantung pada permintaan pengguna. Pastikan setiap jawaban yang kamu berikan jelas, ringkas, dan memberikan nilai tambah bagi pengguna.",
});

// Folder untuk menyimpan history percakapan
const historyFolder = path.resolve(__dirname, "../../tmp");

if (!fs.existsSync(historyFolder)) {
    fs.mkdirSync(historyFolder);
}

// Fungsi untuk membaca history percakapan
function readSessionHistory(sessionId) {
    const filePath = path.join(historyFolder, `${sessionId}.json`);
    if (fs.existsSync(filePath)) {
        const history = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        return history.slice(-10); // Ambil maksimal 10 percakapan terakhir
    }
    return [];
}

// Fungsi untuk menyimpan history percakapan
function saveSessionHistory(sessionId, history) {
    const filePath = path.join(historyFolder, `${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2), "utf-8");
}

module.exports = async (req, res) => {
    const { prompt, apiKey, sessionId } = req.method === "POST" ? req.body : req.query;

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

    if (!prompt) {
        return res.status(400).json({
            status: false,
            msg: "Parameter 'prompt' tidak ditemukan!",
        });
    }

    if (!sessionId) {
        return res.status(400).json({
            status: false,
            msg: "Parameter 'sessionId' diperlukan untuk melacak sesi percakapan!",
        });
    }

    try {
        // Ambil history percakapan sebelumnya
        const history = readSessionHistory(sessionId);
        const context = history.map(entry => `User: ${entry.prompt}\nAI: ${entry.response}`).join("\n");

        // Tambahkan context ke prompt saat ini
        const fullPrompt = `${context}\nUser: ${prompt}`;

        // Hasilkan respons dari AI
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        // Simpan percakapan ke history
        history.push({ prompt, response: responseText });
        saveSessionHistory(sessionId, history);

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
            err: error.message,
        });
    }
};
