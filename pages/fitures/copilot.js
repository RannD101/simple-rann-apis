const axios = require("axios");
const allowedApiKeys = require("../../declaration/arrayKey.jsx");

const apiEndpoint = "https://luminai.my.id/v6";
const cookieValue = process.env.COOKIE || "1-c3jO_BupM3Jt6ClZ6a35VDuzT9j7AK1srCuJ_W4fu_N_INjePgwFK0Tz-VcWcJQzheDUStuvzENORrhKGVpiNL7cr7T1omcxFlm3Ry3rCop1f-oKw92E81Ks-X_Rha_ERYUVhXmUUnwp6gyeA_cIuonUXWy7jEM2VWE8P6H7P8cbF2NtfESKIyI67HxM3aL5S_CCe18LxTGg7cnvUm9cg";

module.exports = async (req, res) => {
    const { text, apiKey } = req.method === "POST" ? req.body : req.query;

    // Validasi API Key
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

    // Validasi Input Text
    if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({
            status: false,
            msg: "Parameter 'text' tidak ditemukan atau kosong!",
        });
    }

    try {
        // Permintaan ke API eksternal
        const response = await axios.post(apiEndpoint, {
            text: text,
            cookie: cookieValue,
        });

        const responseText = response.data?.text;

        if (!responseText) {
            return res.status(500).json({
                status: false,
                msg: "Tidak ada data yang dikembalikan dari API eksternal.",
            });
        }

        // Debugging - Periksa respons asli
        console.log("Original Response Text:", responseText);

        // Langkah 1: Hapus semua tanda [^angka^] menggunakan regex
        let responseText1 = responseText.replace(/\^[0-9]+\^/g, "");
        console.log("After Removing [^angka^]:", responseText1);

        // Langkah 2: Jika regex gagal, lakukan pembersihan manual
        responseText1 = responseText1
            .split("[^")
            .map(part => part.replace(/\d+\^]/, ""))
            .join("");

        // Debugging - Periksa hasil setelah pembersihan manual
        console.log("After Manual Cleanup:", responseText1);

        // Langkah 3: Ubah tanda ** menjadi *
        const responseText2 = responseText1.replace(/\*\*(.*?)\*\*/g, "*$1*");
        console.log("After Replacing ** with *:", responseText2);

        // Respons sukses
        return res.status(200).json({
            status: true,
            msg: "Success!",
            Owner: "Rann",
            response: responseText2, // Respons akhir setelah semua modifikasi
        });
    } catch (error) {
        console.error("Error processing request:", error);

        return res.status(500).json({
            status: false,
            msg: "Terjadi kesalahan dalam menghasilkan respon.",
            err: error.message,
        });
    }
};
