const axios = require("axios")
const allowedApiKeys = require("../../declaration/arrayKey.jsx")

const TikWM = async (url) => {
  try {
    const response = await axios.post("https://www.tikwm.com/api/", null, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "User-Agent": "Postify/1.0.0",
      },
      params: {
        url: url,
        count: 12,
        cursor: 0,
        web: 1,
        hd: 1,
      },
    });

    console.log("Response API:", response.data);

    const data = response.data.data;
    if (!data) throw new Error("Tidak ada response dari API");

    let images = data.images && Array.isArray(data.images) ? data.images : [];
    if (data.otherImages) images.push(...data.otherImages);

    return {
      play: data.play || null,
      play_count: data.play_count,
      title: data.title,
      size: data.size,
      images: images,
    };
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
};

const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

const TikWMHandler = async (req, res) => {
  const { url, apiKey } = req.query;

  // Validasi parameter
  if (!url) {
    return res.status(400).json({ error: "Url TikTok Nya Mana?" });
  }

  if (!apiKey) {
    return res.status(403).json({ error: "Input Parameter ApiKey!" });
  }

  if (!allowedApiKeys.includes(apiKey)) {
    return res.status(403).json({ error: "ApiKey tidak valid!" });
  }

  if (!isValidURL(url)) {
    return res.status(400).json({ error: "URL tidak valid!" });
  }

  try {
    const result = await TikWM(url);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.status(200).json({ data: result });
  } catch (error) {
    console.error("Handler Error:", error.message);
    res.status(500).json({ error: "Ada masalah, coba lagi nanti." });
  }
};
