const axios = require("axios");
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

module.exports = async (req, res) => {
  const { url, apiKey } = req.query;
  
  if (!url) {
    return res.status(400).json({
      error: "Url IG tidak ditemukan!"
    });
  }

  if (!apiKey || !allowedApiKeys.includes(apiKey)) {
    return res.status(403).json({
      error: "Input parameter apikey diperlukan!"
    });
  }

  let apiUrl = `https://api.agatz.xyz/api/instagram?url=${url}`;

  try {
    const response = await axios.get(apiUrl);
    const videoData = response.data.data;

    if (!videoData || !videoData.videoLinks || videoData.videoLinks.length === 0) {
      return res.status(404).json({
        error: "Video tidak ditemukan"
      });
    }

    const videoLinks = videoData.videoLinks.map((video) => ({
      quality: video.quality.trim(),
      url: video.url
    }));

    res.status(200).json({
      status: 200,
      creator: "Rann",
      data: {
        title: videoData.title || "Tidak ada judul",
        description: videoData.description || "Tidak ada deskripsi",
        videoLinks
      }
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: "Terjadi kesalahan saat memproses permintaan"
    });
  }
};
