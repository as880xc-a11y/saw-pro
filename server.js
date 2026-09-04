const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/cart", async (req, res) => {
  const cartUrl = req.query.url;
  if (!cartUrl) return res.status(400).json({ error: "يرجى إدخال رابط السلة" });

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(cartUrl, { waitUntil: "networkidle2" });

    // مثال: استخراج أسماء المنتجات والأسعار
    const products = await page.evaluate(() => {
      let items = [];
      document.querySelectorAll(".product-item").forEach(el => {
        let name = el.querySelector(".product-name")?.innerText || "";
        let price = el.querySelector(".product-price")?.innerText || "";
        items.push({ name, price });
      });
      return items;
    });

    await browser.close();
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: "فشل في جلب بيانات السلة" });
  }
});

app.listen(3000, () => console.log("Proxy server running on port 3000"));
