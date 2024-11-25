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

// Direktori sesi sementara
const fs = require("fs");
const path = require("path");
const sessionsDir = "/tmp/sessions"; // Direktori sementara di Vercel

// Fungsi untuk membaca sesi
async function getSession(sessionId) {
    const sessionFile = path.join(sessionsDir, `${sessionId}.json`);
    if (fs.existsSync(sessionFile)) {
        const sessionData = JSON.parse(fs.readFileSync(sessionFile, "utf-8"));
        return sessionData.messages || [];
    }
    return [];
}

// Fungsi untuk menyimpan sesi
async function saveSession(sessionId, messages) {
    const sessionFile = path.join(sessionsDir, `${sessionId}.json`);
    const sessionData = {
        createdAt: Date.now(),
        messages,
    };
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
}

// Fungsi untuk menghapus sesi lama
async function deleteOldSessions() {
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

// Fungsi utama untuk menangani permintaan AI
async function handleAI(prompt, sessionId) {
    try {
        // Muat OpenAI SDK secara dinamis
        const { Configuration, OpenAIApi } = await loadOpenAI();

        // Inisialisasi OpenAI dengan API key
        const configuration = new Configuration({
            apiKey: "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", // Ganti dengan API key kamu
        });

        const openai = new OpenAIApi(configuration);

        // Ambil atau buat sesi
        const messages = await getSession(sessionId);

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
        await saveSession(sessionId, messages);

        return {
            status: true,
            response: responseText,
        };
    } catch (error) {
        console.error("Error generating AI response:", error);
        return {
            status: false,
            error: error.message,
        };
    }
}

// Panggil pembersihan sesi setiap 1 jam
setInterval(() => {
    deleteOldSessions();
}, 60 * 60 * 1000); // Setiap 1 jam

// Contoh penggunaan
