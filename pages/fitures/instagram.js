const axios = require("axios");
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

module.exports = async (req, res) => {
  const apiKey = req.headers['api-key'] || req.query.apiKey;  // Extract apiKey from header or query parameter
  const urls = req.query.urls;

  // Log req.query to debug the incoming request
  console.log(req.query);

  if (!urls) {
    return res.status(400).json({
      error: "Url Instagram Mana?"
    });
  }

  if (!apiKey || !allowedApiKeys.includes(apiKey)) {
    return res.status(403).json({
      error: "Input Parameter Apikey Tidak Valid!"
    });
  }

  const url = `https://api.agatz.xyz/api/instagram?url=${urls}`;

  try {
    const response = await axios.get(url);

    // Extract the video link from the API response
    const videoLink = response.data.data.videoLinks[0]?.url;
    
    if (!videoLink) {
      return res.status(404).json({
        error: "Video link not found."
      });
    }

    // Return the desired response format
    res.status(200).json({
      status: 200,
      creator: "Rann",
      data: {
        title: response.data.data.title,
        description: response.data.data.description,
        videoLinks: [
          {
            quality: "download (640-1138p)", // You can adjust quality details as needed
            url: videoLink
          }
        ]
      }
    });
  } catch (e) {
    console.error(e);  // Log the error for debugging
    res.status(500).json({
      error: "Terjadi kesalahan internal"
    });
  }
};
