const axios = require("axios");
const cheerio = require("cheerio");
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

module.exports = async (req, res) => {
  const { url, apiKey } = req.query;

  // Validasi API key
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

  // Validasi parameter URL
  if (!url) {
    return res.status(400).json({
      status: false,
      msg: "Parameter 'url' tidak ditemukan!",
    });
  }

  try {
    // Fungsi decoding SnapSave
    function decodeSnapApp(args) {
      let [h, u, n, t, e, r] = args;
      function decode(d, e, f) {
        const g = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/'.split('');
        let h = g.slice(0, e);
        let i = g.slice(0, f);
        let j = d.split('').reverse().reduce(function (a, b, c) {
          if (h.indexOf(b) !== -1) return (a += h.indexOf(b) * Math.pow(e, c));
        }, 0);
        let k = '';
        while (j > 0) {
          k = i[j % f] + k;
          j = (j - (j % f)) / f;
        }
        return k || '0';
      }
      let decodedString = '';
      for (let i = 0, len = h.length; i < len; i++) {
        let s = '';
        while (h[i] !== n[e]) {
          s += h[i];
          i++;
        }
        for (let j = 0; j < n.length; j++) s = s.replace(new RegExp(n[j], 'g'), j.toString());
        decodedString += String.fromCharCode(decode(s, e, 10) - t);
      }
      return decodeURIComponent(encodeURIComponent(decodedString));
    }

    function getEncodedSnapApp(data) {
      return data.split('decodeURIComponent(escape(r))}(')[1].split('))')[0].split(',').map((v) => v.replace(/"/g, '').trim());
    }

    function getDecodedSnapSave(data) {
      return data
        .split('getElementById("download-section").innerHTML = "')[1]
        .split('"; document.getElementById("inputData").remove(); ')[0]
        .replace(/\\?/g, '');
    }

    function decryptSnapSave(data) {
      return getDecodedSnapSave(decodeSnapApp(getEncodedSnapApp(data)));
    }

    // Permintaan ke SnapSave
    const { data: html } = await axios.post('https://snapsave.app/action.php?lang=id', new URLSearchParams({ url }), {
      headers: {
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://snapsave.app',
        'referer': 'https://snapsave.app/id',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
      },
    });

    // Dekripsi data
    const decodedHtml = decryptSnapSave(html);
    const $ = cheerio.load(decodedHtml);

    // Parsing data
    const results = [];
    const thumbnail = $('article.media > figure img').attr('src');

    $('tbody > tr').each((_, el) => {
      const $el = $(el);
      const resolution = $el.find('td').eq(0).text().trim();
      const downloadUrl = $el.find('td').eq(2).find('a').attr('href') || '';
      results.push({ resolution, thumbnail, url: downloadUrl });
    });

    if (results.length === 0) {
      return res.status(404).json({
        status: false,
        msg: 'Tidak ditemukan hasil untuk URL ini.',
      });
    }

    // Respon sukses
    return res.status(200).json({
      status: true,
      msg: 'Success!',
      Owner: 'RannD',
      details: {
        url,
        results,
      },
    });
  } catch (error) {
    console.error('Error:', error.message);

    // Respon jika terjadi kesalahan
    return res.status(500).json({
      status: false,
      msg: 'Terjadi kesalahan pada server!',
      err: error.message,
    });
  }
};
