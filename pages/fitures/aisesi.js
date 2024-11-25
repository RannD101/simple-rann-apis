const { Configuration, OpenAIApi } = require("openai");

// API Key OpenAI
const apiKey = "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";

// Inisialisasi OpenAI
const configuration = new Configuration({ apiKey });
const openai = new OpenAIApi(configuration);

// Penyimpanan sesi di memori
const sessions = {};

// Fungsi utama untuk menangani permintaan REST API
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
        // Jika sesi belum ada, buat sesi baru dengan pesan sistem awal
        if (!sessions[sessionId]) {
            sessions[sessionId] = [
                { role: "system", content: "Kamu adalah Rann AI yang ramah dan informatif. Versimu Mungkin lebih lawas tapi kamu memiliki program mengingat bahasan sebelumnya" },
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

// Fungsi untuk membersihkan sesi otomatis setelah 24 jam
setInterval(() => {
    const now = Date.now();
    for (const sessionId in sessions) {
        if (sessions[sessionId].timestamp && now - sessions[sessionId].timestamp > 24 * 60 * 60 * 1000) {
            delete sessions[sessionId];
        }
    }
}, 60 * 60 * 1000); // Jalankan setiap 1 jam

// Ekspor fungsi untuk digunakan di server
module.exports = handleAI;
