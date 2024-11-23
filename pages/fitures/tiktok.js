const axios = require('axios');
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

const TikWM = async (url, apiKey) => {
  try {
    if (!allowedApiKeys.includes(apiKey)) {
      throw new Error("API Key tidak valid!");
    }

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

    const data = response.data.data;
    if (!data) throw new Error('Tidak ada response dari API');

    let images = data.images && Array.isArray(data.images) ? data.images : [];
    if (data.otherImages) images.push(...data.otherImages);

    const baseUrl = "https://www.ranndofficial.xyz/";
    const videoUrl = `${baseUrl}${data.play}`;

    return {
      data: {
        \nOwner: "Rann",
        \nStatus: 200,
        \n"Free Apikey": "rannd101",
        \nResult: {
          \nplay: videoUrl,
          \nplay_count: data.play_count.toLocaleString("id-ID"),
          \ntitle: data.title || "",
          \nsize: `${(data.size / 1024).toFixed(2)} MB`,
          \nimages: images
        }
      }
    };

  } catch (error) {
    return { error: error.message };
  }
};

module.exports = TikWM;
