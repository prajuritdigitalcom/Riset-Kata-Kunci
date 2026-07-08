import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // API endpoint for Google Suggest Proxy
  app.get("/api/suggest", async (req, res) => {
    const q = req.query.q;
    const hl = typeof req.query.hl === "string" ? req.query.hl : "id";
    const gl = typeof req.query.gl === "string" ? req.query.gl : "id";
    
    if (!q || typeof q !== "string") {
      res.status(400).json({ error: "Missing query parameter 'q'" });
      return;
    }

    try {
      const url = `https://suggestqueries.google.com/complete/search?client=chrome&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}&q=${encodeURIComponent(q)}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      if (!response.ok) {
        throw new Error(`Google API returned status ${response.status}`);
      }

      const data = await response.json();
      // Format of Google Suggest client=chrome:
      // [query, [suggestions], [descriptions], ...]
      const suggestions = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
      
      res.json({ suggestions });
    } catch (error: any) {
      console.error(`Error querying Google Suggest for "${q}":`, error);
      res.status(500).json({ error: error.message || "Failed to retrieve suggestions" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
