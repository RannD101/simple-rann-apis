const axios = require('axios');
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

const TikWM = async (url, apiKey) => {
  try {
    // Verifikasi API key
    if (!allowedApiKeys.includes(apiKey)) {
      throw new Error("API Key tidak valid!");
    }

    // Permintaan ke API TikWM
    const response = await axios.post('https://www.tikwm.com/api/', null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'User-Agent': 'Postify/1.0.0',
      },
      params: {
        url: url,
        count: 12,
        cursor: 0,
        web: 1,
        hd: 1
      }
    });

    console.log('Response API:', response.data);

    const data = response.data.data;
    if (!data) throw new Error('Tidak ada response dari API');

    let images = data.images && Array.isArray(data.images) ? data.images : [];
    if (data.otherImages) images.push(...data.otherImages);

    // Tambahkan base URL pada URL play
    const baseUrl = "https://www.ranndofficial.xyz/"; // Sesuaikan dengan base URL yang sesuai
    const videoUrl = baseUrl + data.play;

    return {
      Owner: "Rann",
      Status: 200,
      "Free Apikey": "rannd101",
      Result: {
        play: videoUrl,
        play_count: data.play_count,
        title: data.title || "",
        size: `${data.size} KB`,
        images: images
      }
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

module.exports = { TikWM, isValidURL };