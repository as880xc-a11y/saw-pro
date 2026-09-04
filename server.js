const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

const USD_TO_IQD = 1350; // سعر التحويل

app.get("/cart", async (req, res) => {
  const cartUrl = req.query.url;
  if (!cartUrl) {
    return res.status(400).json({ error: "يرجى إدخال رابط السلة" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto(cartUrl, { waitUntil: "networkidle2" });

    // انتظر حتى تظهر عناصر السلة
    await page.waitForSelector(".product-item", { timeout: 10000 });

    // استخراج المنتجات من الصفحة
    const products = await page.evaluate(() => {
      let items = [];
      document.querySelectorAll(".product-item").forEach(el => {
        let name = el.querySelector(".product-name")?.innerText || "";
        let priceText = el.querySelector(".product-price")?.innerText || "";
        let img = el.querySelector("img")?.src || "";
        items.push({ name, priceText, img });
      });
      return items;
    });

    await browser.close();

    // تحويل الأسعار إلى أرقام وحساب المجموع
    let totalUSD = 0;
    const discountKuwait = 0.1; // خصم 10%
    const productsWithIQD = products.map(p => {
      const priceUSD = parseFloat(p.priceText.replace(/[^\d.]/g, "")) || 0;
      totalUSD += priceUSD;
      return {
        name: p.name,
        priceIQD: priceUSD * USD_TO_IQD,
        img: p.img
      };
    });

    totalUSD = totalUSD - (totalUSD * discountKuwait);
    const totalIQD = totalUSD * USD_TO_IQD;

    res.json({
      products: productsWithIQD,
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
