const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cheerio = require("cheerio");

const igdl = async (req, res) => {
  try {
    // Validasi API Key
    const { apikey, url } = req.query;
    const validApiKey = "rannd101"; // Ganti dengan API key Anda

    if (!apikey || apikey !== validApiKey) {
      return res.status(401).json({
        status: false,
        msg: "API key tidak valid atau tidak ditemukan.",
      });
    }

    // Validasi URL
    if (!url) {
      return res.status(400).json({
        status: false,
        msg: "Parameter 'url' wajib diisi.",
      });
    }

    // Fungsi decoding (tidak berubah)
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
      return data.split("decodeURIComponent(escape(r))}(")[1].split("))")[0].split(",").map((v) => v.replace(/"/g, "").trim());
    }

    function getDecodedSnapSave(data) {
      return data.split('getElementById("download-section").innerHTML = "')[1].split('"; document.getElementById("inputData").remove(); ')[0].replace(/\\?/g, "");
    }

    function decryptSnapSave(data) {
      return getDecodedSnapSave(decodeSnapApp(getEncodedSnapApp(data)));
    }

    // Fetch data dari SnapSave
    const response = await fetch("https://snapsave.app/action.php?lang=id", {
      method: "POST",
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "content-type": "application/x-www-form-urlencoded",
        origin: "https://snapsave.app",
        referer: "https://snapsave.app/id",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
      },
      body: new URLSearchParams({ url }),
    });

    const html = await response.text();
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
        if (/get_progressApi/ig.test(_url || "")) {
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
        msg: "Data tidak ditemukan.",
      });
    }

    // Respon sukses
    return res.status(200).json({
      status: true,
      msg: "Berhasil mengambil data.",
      data: results,
    });
  } catch (e) {
    // Respon error
    return res.status(500).json({
      status: false,
      msg: "Terjadi kesalahan pada server.",
      err: e.message,
    });
  }
};

module.exports = igdl;
