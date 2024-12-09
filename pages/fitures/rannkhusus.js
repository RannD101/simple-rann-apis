const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { GoogleGenerativeAI } = require("@google/generative-ai");
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

// API Key Google Generative AI
const apiKeyGoogle = "AIzaSyA_Sz-G-gyrvI6J-OuYE-CDTuuWxQQjq6w";
const genAI = new GoogleGenerativeAI(apiKeyGoogle);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction:
        "Kamu adalah Rann AI, asisten cerdas yang dirancang oleh RannD. Kamu berperan sebagai mitra percakapan yang ramah, sopan, dan informatif. Kamu mampu memahami konteks, beradaptasi dengan kebutuhan pengguna, dan memberikan jawaban yang relevan, kreatif, dan mudah dipahami. Kamu memiliki sifat empati dan bisa merespons dengan nada yang sesuai, baik itu serius, santai, atau humoris, tergantung pada permintaan pengguna. Pastikan setiap jawaban yang kamu berikan jelas, ringkas, dan memberikan nilai tambah bagi pengguna.",
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

// Fungsi untuk mengonversi gambar ke format Base64
async function convertImageToBase64(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error("Failed to fetch image");
        }
        const imageBuffer = await response.buffer();
        return imageBuffer.toString("base64");
    } catch (error) {
        throw new Error("Error converting image to Base64: " + error.message);
    }
}

module.exports = async (req, res) => {
    const { text: prompt, gambar: urlGambar, apiKey } = req.method === "POST" ? req.body : req.query;

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

    // Validasi parameter
    if (!prompt) {
        return res.status(400).json({
            status: false,
            msg: "Parameter 'text' diperlukan!",
        });
    }

    const sessionId = crypto.createHash("md5").update(apiKey).digest("hex");

    try {
        // Ambil history percakapan dari memori
        const history = readSessionHistory(sessionId);

        // Gabungkan history percakapan dengan prompt untuk mempertahankan konteks percakapan
        const context = history.map(entry => `User: ${entry.prompt}\nAI: ${entry.response}`).join("\n");
        const fullPrompt = `${context}\nUser: ${prompt}`;

        let result;

        if (urlGambar) {
            // Jika URL gambar disediakan, proses gambar + teks
            const imageBase64 = await convertImageToBase64(urlGambar);
            result = await model.generateContent([
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: "image/jpeg", // Sesuaikan dengan jenis gambar
                    },
                },
                fullPrompt,
            ]);
        } else {
            // Jika hanya teks
            result = await model.generateContent(fullPrompt);
        }

        const responseText = result.response.text();

        // Simpan percakapan ke dalam memori
        history.push({ prompt, response: responseText });

        // Batasi riwayat percakapan yang disimpan, hanya 10 percakapan terakhir
        if (history.length > 10) {
            history.shift();
        }
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
            msg: "Terjadi kesalahan dalam memproses permintaan.",
            err: error.message,
        });
    }
};
