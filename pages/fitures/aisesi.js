// Fungsi untuk memuat OpenAI SDK secara dinamis
async function loadOpenAI() {
    try {
        const { Configuration, OpenAIApi } = await import("openai");
        return { Configuration, OpenAIApi };
    } catch (error) {
        console.error("Error loading OpenAI module:", error);
        throw error;
    }
}

// Fungsi untuk memuat modul fs dan path secara dinamis
async function loadFileSystemModules() {
    const fs = await import("fs");
    const path = await import("path");
    return { fs, path };
}

// Direktori sesi sementara
const sessionsDir = "/tmp/sessions"; // Direktori sementara di Vercel

// Fungsi untuk membaca sesi
async function getSession(sessionId, fs, path) {
    const sessionFile = path.join(sessionsDir, `${sessionId}.json`);
    if (fs.existsSync(sessionFile)) {
        const sessionData = JSON.parse(fs.readFileSync(sessionFile, "utf-8"));
        return sessionData.messages || [];
    }
    return [];
}

// Fungsi untuk menyimpan sesi
async function saveSession(sessionId, messages, fs, path) {
    const sessionFile = path.join(sessionsDir, `${sessionId}.json`);
    const sessionData = {
        createdAt: Date.now(),
        messages,
    };
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
}

// Fungsi untuk menghapus sesi lama
async function deleteOldSessions(fs, path) {
    const now = Date.now();
    const sessionFiles = fs.readdirSync(sessionsDir);

    sessionFiles.forEach((file) => {
        const sessionFilePath = path.join(sessionsDir, file);
        const sessionData = JSON.parse(fs.readFileSync(sessionFilePath, "utf-8"));
        if (sessionData.createdAt && now - sessionData.createdAt > 24 * 60 * 60 * 1000) {
            fs.unlinkSync(sessionFilePath);
            console.log(`Deleted old session: ${file}`);
        }
    });
}

// Fungsi untuk mengirim respons dengan status dan pesan
function sendResponse(res, statusCode, status, msg, data = null) {
    return res.status(statusCode).json({
        status,
        msg,
        response: data,
    });
}

// Fungsi utama untuk menangani permintaan AI
async function handleAI(req, res) {
    const { prompt, sessionId } = req.method === "POST" ? req.body : req.query;

    if (!prompt) {
        return sendResponse(res, 400, false, "Parameter 'prompt' tidak ditemukan!");
    }

    try {
        // Muat OpenAI SDK secara dinamis
        const { Configuration, OpenAIApi } = await loadOpenAI();

        // Muat modul fs dan path
        const { fs, path } = await loadFileSystemModules();

        // Inisialisasi OpenAI dengan API key
        const configuration = new Configuration({
            apiKey: "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",
        });

        const openai = new OpenAIApi(configuration);

        // Ambil atau buat sesi
        const messages = await getSession(sessionId, fs, path);

        // Tambahkan prompt user ke sesi
        messages.push({ role: "user", content: prompt });

        // Kirim permintaan ke OpenAI
        const chatCompletion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Kamu adalah asisten AI yang ramah dan informatif." },
                ...messages,
            ],
        });

        const responseText = chatCompletion.data.choices[0].message.content;

        // Tambahkan respons AI ke sesi
        messages.push({ role: "assistant", content: responseText });

        // Simpan sesi
        await saveSession(sessionId, messages, fs, path);

        return sendResponse(res, 200, true, "Success!", responseText);
    } catch (error) {
        console.error("Error generating AI response:", error);
        return sendResponse(res, 500, false, "Terjadi kesalahan dalam menghasilkan respon.", error.message);
    }
}

// Panggil pembersihan sesi setiap 1 jam
setInterval(async () => {
    // Muat modul fs dan path secara dinamis
    const { fs, path } = await loadFileSystemModules();
    deleteOldSessions(fs, path);
}, 60 * 60 * 1000); // Setiap 1 jam

// Ekspor fungsi handleAI untuk digunakan di server
module.exports = handleAI;
