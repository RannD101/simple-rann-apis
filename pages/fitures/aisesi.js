// Pastikan untuk memuat modul secara dinamis
async function loadOpenAI() {
    try {
        const { OpenAI } = await import("openai");
        return OpenAI;
    } catch (error) {
        console.error("Error loading OpenAI module:", error);
        throw error;
    }
}

// Fungsi untuk mengelola sesi
const fs = require("fs");
const path = require("path");

// Tentukan direktori sesi yang dapat digunakan dalam lingkungan server
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
        // Muat modul OpenAI secara dinamis
        const OpenAI = await loadOpenAI();

        // Inisialisasi OpenAI dengan API key
        const openai = new OpenAI({
            apiKey: "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", // Ganti dengan API key kamu
        });

        // Ambil atau buat sesi
        const messages = await getSession(sessionId);

        // Tambahkan prompt user ke sesi
        messages.push({ role: "user", content: prompt });

        // Kirim permintaan ke OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "Kamu adalah asisten AI yang ramah dan informatif." },
                ...messages,
            ],
        });

        const responseText = response.choices[0].message.content;

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
