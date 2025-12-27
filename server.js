require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const Bottleneck = require("bottleneck");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// --- RATE LIMITER ---
const limiter = new Bottleneck({
  minTime: 21,
  maxConcurrent: 10,
});
const limiterAxios = limiter.wrap(axios.get);

// --- HELPER: Clean Text ---
// 1. Replace symbols (like - or :) with a space so "Spider-Man" becomes "Spider Man"
// 2. Remove double spaces
// 3. Lowercase everything
function cleanQuery(text) {
  return text
    .replace(/[^\w\s]/gi, " ") // Replace symbols with space
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim()
    .toLowerCase();
}

// --- UNIFIED SEARCH ENDPOINT ---
app.get("/search", async (req, res) => {
  const rawQuery = req.query.q;
  const page = req.query.page || 1; // Default to page 1 if not sent

  if (!rawQuery) return res.status(400).json({ error: "Query required" });

  const finalQuery = cleanQuery(rawQuery);

  try {
    const response = await limiterAxios(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        query: finalQuery,
        language: "en-US",
        include_adult: false,
        page: page, // <--- Send the page number to TMDB
      },
    });

    // Filter: Must be Movie/TV AND have a date
    const watchableContent = response.data.results.filter((item) => {
      const isMedia = item.media_type === "movie" || item.media_type === "tv";
      const hasDate = item.release_date || item.first_air_date;
      return isMedia && hasDate;
    });

    res.json({ results: watchableContent });
  } catch (error) {
    console.error("Search failed:", error.message);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Rate Limiter Active: Max 49 req/sec`);
});
