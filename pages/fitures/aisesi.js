const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const path = require("path");

// Konfigurasi OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // API Key dari environment
});
const openai = new OpenAIApi(configuration);

// Fungsi untuk menyimpan data ke session file di /tmp
function saveSessionData(sessionId, data) {
  const sessionFilePath = path.join("/tmp", `${sessionId}.json`);
  
  // Simpan data session ke file
  fs.writeFileSync(sessionFilePath, JSON.stringify(data));
}

// Fungsi untuk membaca data session dari /tmp
function loadSessionData(sessionId) {
  const sessionFilePath = path.join("/tmp", `${sessionId}.json`);
  
  if (fs.existsSync(sessionFilePath)) {
    return JSON.parse(fs.readFileSync(sessionFilePath));
  }
  
  return null;
}

// Fungsi untuk menghapus session setelah lebih dari 3 jam
function deleteSessionIfExpired(sessionId) {
  const sessionFilePath = path.join("/tmp", `${sessionId}.json`);
  
  if (fs.existsSync(sessionFilePath)) {
    const sessionData = JSON.parse(fs.readFileSync(sessionFilePath));
    
    // Cek apakah sesi sudah lebih dari 3 jam
    const currentTime = Date.now();
    const sessionTimestamp = sessionData.timestamp;

    // Jika lebih dari 3 jam (3 jam = 3 * 60 * 60 * 1000 ms)
    if (currentTime - sessionTimestamp > 3 * 60 * 60 * 1000) {
      fs.unlinkSync(sessionFilePath); // Hapus file sesi
      console.log(`Session ${sessionId} telah dihapus karena sudah lebih dari 3 jam.`);
    }
  }
}

// Fungsi untuk melakukan percakapan dengan OpenAI
const chatCompletion = async (prompt) => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });
  return response.data.choices[0].message.content;
};

// Fungsi untuk menangani permintaan API
module.exports = async (req, res) => {
  const { prompt, sessionId } = req.method === "GET" ? req.query : req.body;  // Mengambil data dari query string jika GET request

  // Validasi session ID (misalnya harus alphanumeric dengan panjang 8-32 karakter)
  const sessionIdRegex = /^[a-zA-Z0-9]{8,32}$/;
  if (!sessionId || !sessionIdRegex.test(sessionId)) {
    return res.status(400).json({
      status: false,
      msg: "Session ID tidak valid! Harus alphanumeric dan panjang 8-32 karakter.",
    });
  }

  // Validasi parameter 'prompt'
  if (!prompt) {
    return res.status(400).json({
      status: false,
      msg: "Parameter 'prompt' tidak ditemukan!",
    });
  }

  try {
    // Hapus session yang sudah lebih dari 3 jam
    deleteSessionIfExpired(sessionId);

    // Cek apakah session ID sudah ada, jika ada muat data sebelumnya
    const sessionData = loadSessionData(sessionId);

    // Jika tidak ada data sebelumnya, buat session baru
    if (!sessionData) {
      saveSessionData(sessionId, { promptHistory: [], timestamp: Date.now() }); // Simpan history prompt dan timestamp untuk session baru
    }

    // Melakukan percakapan dengan OpenAI
    const result = await chatCompletion(prompt);
    
    // Update data sesi dengan hasil percakapan
    const updatedSessionData = loadSessionData(sessionId);
    updatedSessionData.promptHistory.push({ prompt, response: result });

    // Simpan data sesi setelah update
    saveSessionData(sessionId, updatedSessionData);

    // Kirim respon ke pengguna
    res.status(200).json({
      status: true,
      msg: "Success!",
      response: result,
      sessionId: sessionId,
      promptHistory: updatedSessionData.promptHistory,
    });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({
      status: false,
      msg: "Terjadi kesalahan dalam menghasilkan respon.",
      response: error.message,
    });
  }
};
