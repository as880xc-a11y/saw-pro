const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio");

const app = express();
app.use(cors());

const USD_TO_IQD = 1350;

app.get("/cart", async (req, res) => {
  const cartUrl = req.query.url;
  if (!cartUrl) {
    return res.status(400).json({ error: "يرجى إدخال رابط السلة" });
  }

  try {
    const response = await axios.get(cartUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    const products = [];
    $(".cart-item").each((i, el) => {
      const name = $(el).find(".goods-name").text().trim();
      const priceText = $(el).find(".goods-price").text().trim();
      const img = $(el).find("img").attr("src");
      const priceUSD = parseFloat(priceText.replace(/[^\d.]/g, "")) || 0;
      products.push({ name, priceUSD, img });
    });

    const discountKuwait = 0.1;
    let totalUSD = products.reduce((sum, p) => sum + p.priceUSD, 0);
    totalUSD = totalUSD - (totalUSD * discountKuwait);
    const totalIQD = totalUSD * USD_TO_IQD;

    res.json({
      products: products.map(p => ({
        name: p.name,
        priceIQD: p.priceUSD * USD_TO_IQD,
        img: p.img
      })),
      totalIQD
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "فشل في جلب بيانات السلة أو تحليلها" });
  }
});

app.listen(3000, () => {
  console.log("🚀 الخادم يعمل على المنفذ 3000");
});
