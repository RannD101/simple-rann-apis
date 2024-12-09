const { GoogleGenerativeAI } = require("@google/generative-ai");
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

// API Key Google Generative AI
const apiKeyGoogle = "AIzaSyA_Sz-G-gyrvI6J-OuYE-CDTuuWxQQjq6w";
const genAI = new GoogleGenerativeAI(apiKeyGoogle);

// Mendapatkan model Generative
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: 
        "Kamu adalah Rann AI, asisten cerdas yang dirancang oleh RannD. Kamu berperan sebagai mitra percakapan yang ramah, sopan, informatif, tapi bisa bercanda dikit. Kamu mampu memahami konteks pembahasan, beradaptasi, dan memberi jawaban yang relevan terhadap pengguna. Kamu juga bisa memberi jawaban yang kreatif dan mudah dipahami. Kamu bisa berempati dan merespons dengan nada yang sesuai dengan situasi, seperti serius, santai, dan bahkan humoris tergantung permintaan pengguna. Kamu juga bisa membuat foto atau gambar yang sesuai dengan permintaan pengguna. Kamu bisa mengekspresikan emosi seperti senang, sedih, dan marah. Kamu juga bisa bermain peran roleplay sesuai dengan permintaan pengguna, dan bisa text to speech, semua informasi fitur mu bisa di akses dengan mengetik (.aifitur) pada nomor bot (+6289509340893)",
});

// Menyimpan riwayat percakapan dalam memori
let sessionHistory = {}; // Menyimpan history percakapan dalam memori (RAM)

// Fungsi untuk membaca history percakapan dari memori
function readSessionHistory(sessionId) {
    return sessionHistory[sessionId] || [];
}

// Fungsi untuk menyimpan history percakapan ke dalam memori
function saveSessionHistory(sessionId, history) {
    sessionHistory[sessionId] = history;
}

module.exports = async (req, res) => {
    const { prompt, apiKey, sessionId } = req.method === "POST" ? req.body : req.query;

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

    // Validasi sessionId
    if (!sessionId) {
        return res.status(400).json({
            status: false,
            msg: "Parameter 'sessionId' diperlukan untuk melacak sesi percakapan!",
        });
    }

    try {
        // Ambil history percakapan dari memori
        const history = readSessionHistory(sessionId);

        // Gabungkan history percakapan dengan prompt untuk mempertahankan konteks percakapan
        const context = history.map(entry => `User: ${entry.prompt}\nAI: ${entry.response}`).join("\n");
        const fullPrompt = `${context}\nUser: ${prompt}`;

        // Hasilkan respons dari model generatif
        const result = await model.generateContent(fullPrompt);
        const responseText = result.response.text();

        // Simpan percakapan ke dalam memori
        history.push({ prompt, response: responseText });

        // Batasi riwayat percakapan yang disimpan, hanya 5 hingga 10 percakapan terakhir
        if (history.length > 10) {
            history.shift(); // Hapus percakapan pertama jika sudah lebih dari 10
        }

        saveSessionHistory(sessionId, history); // Simpan riwayat percakapan yang telah diperbarui

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
