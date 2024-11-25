const { Configuration, OpenAIApi } = require("openai");

// Objek untuk menyimpan sesi di memori
const sessions = {};

// Fungsi utama untuk menangani permintaan AI
async function handleAI(req, res) {
    const { prompt, sessionId } = req.method === "POST" ? req.body : req.query;

    if (!prompt) {
        return res.status(400).json({
            status: false,
            msg: "Parameter 'prompt' tidak ditemukan!",
        });
    }

    if (!sessionId) {
        return res.status(400).json({
            status: false,
            msg: "Parameter 'sessionId' diperlukan!",
        });
    }

    try {
        // Inisialisasi OpenAI dengan API key
        const configuration = new Configuration({
            apiKey: "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",
        });
        const openai = new OpenAIApi(configuration);

        // Buat sesi baru jika belum ada
        if (!sessions[sessionId]) {
            sessions[sessionId] = [
                { role: "system", content: "Kamu adalah asisten AI yang ramah dan informatif." },
            ];
        }

        // Tambahkan pesan pengguna ke sesi
        sessions[sessionId].push({ role: "user", content: prompt });

        // Kirim permintaan ke OpenAI
        const chatCompletion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: sessions[sessionId],
        });

        const responseText = chatCompletion.data.choices[0].message.content;

        // Tambahkan respons AI ke sesi
        sessions[sessionId].push({ role: "assistant", content: responseText });

        return res.status(200).json({
            status: true,
            msg: "Success!",
            response: responseText,
        });
    } catch (error) {
        console.error("Error generating AI response:", error);

        return res.status(500).json({
            status: false,
            msg: "Terjadi kesalahan dalam menghasilkan respon.",
            response: error.message,
        });
    }
}

// Fungsi untuk membersihkan sesi setelah 24 jam
setInterval(() => {
    const now = Date.now();
    for (const sessionId in sessions) {
        if (sessions[sessionId].timestamp && now - sessions[sessionId].timestamp > 24 * 60 * 60 * 1000) {
            delete sessions[sessionId];
        }
    }
}, 60 * 60 * 1000); // Jalankan setiap jam

// Ekspor fungsi handleAI untuk digunakan di server
module.exports = handleAI;
