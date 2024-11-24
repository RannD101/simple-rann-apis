const axios = require("axios");
const cheerio = require("cheerio");
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

module.exports = async (req, res) => {
  const { url, apiKey } = req.query;

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

  // Validasi parameter URL
  if (!url) {
    return res.status(400).json({
      status: false,
      msg: "Parameter 'url' tidak ditemukan!",
    });
  }

  try {
    function decodeSnapApp(args) {
      let [h, u, n, t, e, r] = args;
      function decode(d, e, f) {
        const g = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/".split("");
        let h = g.slice(0, e);
        let i = g.slice(0, f);
        let j = d.split("").reverse().reduce(function (a, b, c) {
          if (h.indexOf(b) !== -1)
            return (a += h.indexOf(b) * Math.pow(e, c));
        }, 0);
        let k = "";
        while (j > 0) {
          k = i[j % f] + k;
          j = (j - (j % f)) / f;
        }
        return k || "0";
      }
      let decodedString = "";
      for (let i = 0, len = h.length; i < len; i++) {
        let s = "";
        while (h[i] !== n[e]) {
          s += h[i];
          i++;
        }
        for (let j = 0; j < n.length; j++) s = s.replace(new RegExp(n[j], "g"), j.toString());
        decodedString += String.fromCharCode(decode(s, e, 10) - t);
      }
      return decodeURIComponent(encodeURIComponent(decodedString));
    }

    function getEncodedSnapApp(data) {
      // Pastikan data yang diproses tidak undefined
      if (!data || !data.includes("decodeURIComponent(escape(r))}(")) {
        throw new Error("Encoded SnapApp data tidak valid.");
      }
      return data.split("decodeURIComponent(escape(r))}(")[1].split("))")[0].split(",").map((v) => v.replace(/"/g, "").trim());
    }

    function getDecodedSnapSave(data) {
      // Pastikan data yang diproses tidak undefined
      if (!data || !data.includes('getElementById("download-section").innerHTML = "')) {
        throw new Error("Decoded SnapSave data tidak valid.");
      }
      return data.split('getElementById("download-section").innerHTML = "')[1].split('"; document.getElementById("inputData").remove(); ')[0].replace(/\\?/g, "");
    }

    function decryptSnapSave(data) {
      // Menangani jika data tidak valid
      try {
        return getDecodedSnapSave(decodeSnapApp(getEncodedSnapApp(data)));
      } catch (error) {
        throw new Error("Error saat mendekode SnapSave: " + error.message);
      }
    }

    // Mengambil HTML dari SnapSave
    const { data: html } = await axios.post("https://snapsave.app/action.php?lang=id", null, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://snapsave.app",
        referer: "https://snapsave.app/id",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
      },
      params: { url },
    });

    const decode = decryptSnapSave(html);
    const $ = cheerio.load(decode);
    const results = [];

    if ($("table.table").length || $("article.media > figure").length) {
      const thumbnail = $("article.media > figure").find("img").attr("src");
      $("tbody > tr").each((_, el) => {
        const $el = $(el);
        const $td = $el.find("td");
        const resolution = $td.eq(0).text();
        let _url = $td.eq(2).find("a").attr("href") || $td.eq(2).find("button").attr("onclick");
        if (/get_progressApi/gi.test(_url || "")) {
          _url = /get_progressApi'(.*?)'/.exec(_url || "")?.[1] || _url;
        }
        results.push({ resolution, thumbnail, url: _url });
      });
    } else {
      $("div.download-items__thumb").each((_, tod) => {
        const thumbnail = $(tod).find("img").attr("src");
        $("div.download-items__btn").each((_, ol) => {
          let _url = $(ol).find("a").attr("href");
          if (!/https?:\/\//.test(_url || "")) _url = `https://snapsave.app${_url}`;
          results.push({ thumbnail, url: _url });
        });
      });
    }

    if (!results.length) {
      return res.status(404).json({
        status: false,
        msg: "Tidak ditemukan data.",
      });
    }

    // Respon sukses
    return res.status(200).json({
      status: true,
      msg: "Success!",
      Owner: "RannD",
      details: {
        query: url,
        results,
      },
    });
  } catch (e) {
    console.error("Error:", e.message);

    // Respon jika terjadi kesalahan pada server
    return res.status(500).json({
      status: false,
      msg: "Terjadi kesalahan pada server!",
      err: e.message,
    });
  }
};
