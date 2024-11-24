const axios = require("axios")
const allowedApiKeys = require("../../declaration/arrayKey.jsx")

module.exports = async (req, res) => {
  // Mendapatkan parameter `urls` dan `apiKey` dari query string
  const url = req.query.urls
  const apiKey = req.query.apiKey // API key yang dikirim dalam query parameter

  if (!url) {
    return res.status(400).json({
      error: "Url Ig Nya Mana?" // Memberikan pesan jika parameter `urls` tidak ada
    })
  }

  if (!apiKey || !allowedApiKeys.includes(apiKey)) {
    return res.status(403).json({
      error: "Input Parameter Apikey !" // Jika API key tidak valid atau tidak ada
    })
  }

  // URL untuk API eksternal menggunakan parameter `urls` yang diterima
  let apiUrl = `https://api.agatz.xyz/api/instagram?url=${url}`

  try {
    const response = await axios.get(apiUrl)
    const data = response.data.data
    
    // Memeriksa apakah `videoLinks` tersedia dalam data
    if (!data || !data.videoLinks || data.videoLinks.length === 0) {
      return res.status(404).json({
        error: "Video tidak ditemukan"
      })
    }

    const videoLinks = data.videoLinks.map(link => ({
      quality: link.quality.trim(),
      url: link.url
    }))
    
    res.status(200).json({
      status: 200,
      creator: "Rann", // Nama pembuat tetap
      data: {
        title: data.title,
        description: data.description || "", // Deskripsi kosong jika tidak ada
        videoLinks: videoLinks
      }
    })
  } catch (e) {
    console.error(e) // Log error untuk debugging
    res.status(500).json({
      error: "Terjadi kesalahan internal",
      details: e.message // Mengembalikan pesan error yang lebih rinci untuk debugging
    })
  }
}
