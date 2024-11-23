const axios = require("axios");
const cheerio = require("cheerio");
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

module.exports = async (req, res) => {
  const { query, apiKey } = req.query;

  // Validasi apikey
  if (!apiKey) {
    return res.status(403).json({
      status: false,
      msg: "Input parameter 'apikey' diperlukan!",
    });
  }

  if (!allowedApiKeys.includes(apiKey)) {
    return res.status(403).json({
      status: false,
      msg: "Apikey tidak valid!",
    });
  }

  // Validasi parameter query
  if (!query) {
    return res.status(400).json({
      status: false,
      msg: "Parameter 'query' tidak ditemukan!",
    });
  }

  try {
    // URL pencarian makanan
    const searchUrl = `https://mobile.fatsecret.co.id/kalori-gizi/search?q=${encodeURIComponent(query)}`;
    console.log(`Fetching: ${searchUrl}`);

    // Mendapatkan hasil pencarian pertama
    const { data } = await axios.get(searchUrl);
    const $ = cheerio.load(data);
    const firstResultLink = $('a[href*="/kalori-gizi/umum/"]').attr("href");

    if (!firstResultLink) {
      return res.status(404).json({
        status: false,
        msg: "Tidak ditemukan hasil untuk query ini.",
      });
    }

    // Mendapatkan detail nutrisi dari hasil pertama
    const fullUrl = `https://mobile.fatsecret.co.id${firstResultLink}`;
    console.log(`Fetching details from: ${fullUrl}`);

    const detailsPage = await axios.get(fullUrl);
    const $details = cheerio.load(detailsPage.data);

    const kalori = $details('td.box:contains("Kal")').find(".light-text").text().trim();
    const lemak = $details('td.box:contains("Lemak")').find(".light-text").text().trim();
    const karbohidrat = $details('td.box:contains("Karb")').find(".light-text").text().trim();
    const protein = $details('td.box:contains("Prot")').find(".light-text").text().trim();

    // Respon jika berhasil
    return res.status(200).json({
      status: true,
      msg: "Success!",
      Owner: "RannD",
      details: {
        query, // Tambahkan query yang dicari
        kalori,
        lemak,
        karbohidrat,
        protein,
      },
    });
  } catch (error) {
    console.error("Error:", error.message);

    // Respon jika terjadi kesalahan pada server
    return res.status(500).json({
      status: false,
      msg: "Terjadi kesalahan pada server!",
      err: error.message,
    });
  }
};
