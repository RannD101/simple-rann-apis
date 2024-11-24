const axios = require("axios")
const allowedApiKeys = require("../../declaration/arrayKey.jsx")

module.exports = async (req, res) => {
  console.log('Query Params:', req.query);

  const { urls, apiKey } = req.query

  // Memastikan parameter `urls` ada
  if (!urls) {
    return res.status(400).json({
      error: "Url Ig Nya Mana?"  // Jika parameter `urls` tidak ada
    })
  }

  // Memeriksa validitas API key
  if (!apiKey || !allowedApiKeys.includes(apiKey)) {
    return res.status(403).json({
      error: "Input Parameter Apikey !"  // Jika API key tidak valid atau tidak ada
    })
  }

  let apiUrl = `https://api.agatz.xyz/api/instagram?url=${urls}`

  try {
    const response = await axios.get(apiUrl)
    console.log('API Response:', response.data);  // Log respons dari API eksternal untuk debugging

    const data = response.data.data

    // Jika data tidak ditemukan atau videoLinks kosong
    if (!data || !data.videoLinks || data.videoLinks.length === 0) {
      return res.status(404).json({
        error: "Video tidak ditemukan"  // Jika tidak ada video link dalam respons
      })
    }

    // Menyesuaikan format respons yang sesuai
    const videoLinks = data.videoLinks.map(link => ({
      quality: link.quality.trim(),  // Membersihkan spasi di sekitar kualitas
      url: link.url
    }))
    
    // Mengembalikan respons yang sudah sesuai dengan format yang diinginkan
    res.status(200).json({
      status: 200,
      creator: "RannD",  // Menggunakan nama pembuat yang benar
      data: {
        title: data.title,
        description: data.description || "",  // Jika deskripsi kosong, set sebagai string kosong
        videoLinks: videoLinks  // Menyertakan daftar videoLinks
      }
    })
  } catch (e) {
    console.error(e)  // Log error untuk debugging
    res.status(500).json({
      error: "Terjadi kesalahan internal",
      details: e.message  // Menampilkan detail error yang lebih rinci
    })
  }
}
