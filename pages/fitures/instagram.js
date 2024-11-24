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
    const videoUrl = response.data.data.url_list[0];
    res.status(200).json({
      videoUrl
    });
  } catch (e) {
    console.error(e);  // Log the error for debugging
    res.status(500).json({
      error: "Terjadi kesalahan internal"
    });
  }
};
