const axios = require("axios")
const allowedApiKeys = require("../../declaration/arrayKey.jsx")

module.exports = async (req, res) => {
  const urls = req.query.urls
  const apiKey = req.query.apiKey // Assuming the API key is passed as a query parameter
  
  if (!urls) {
    return res.status(400).json({
      error: "Url Ig Nya Mana?"
    })
  }

  if (!apiKey || !allowedApiKeys.includes(apiKey)) {
    return res.status(403).json({
      error: "Input Parameter Apikey !"
    })
  }

  let url = `https://api.agatz.xyz/api/instagram?url=${urls}`

  try {
    const response = await axios.get(url)
    const data = response.data.data
    const videoLinks = data.videoLinks.map(link => ({
      quality: link.quality.trim(), // Clean up extra spaces
      url: link.url
    }))
    
    res.status(200).json({
      status: 200,
      creator: "Rann", // Static creator name
      data: {
        title: data.title,
        description: data.description || "", // Empty description if not available
        videoLinks: videoLinks
      }
    })
  } catch (e) {
    res.status(500).json({
      error: "Ada masalah, coba lagi nanti"
    })
  }
}
