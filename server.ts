import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { lookupFacebookUid, normalizeFacebookUrl } from "./lib/facebookUid.js";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT ?? 3000);

  app.use(express.json());

  // API to lookup Facebook UID
  app.post("/api/lookup-uid", async (req, res) => {
    let { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    url = normalizeFacebookUrl(url);

    try {
      console.log(`Looking up UID for URL: ${url}`);
      const uid = await lookupFacebookUid(url);

      if (uid) {
        console.log(`Found UID: ${uid}`);
        return res.json({ uid });
      } else {
        console.warn(`Could not find UID for URL: ${url}`);
        return res.status(404).json({ error: "Could not find UID. The profile might be private or protected." });
      }
    } catch (error: any) {
      const status = error?.status ?? error?.response?.status;
      console.error("Lookup error details:", status, error.message);
      if (status === 400) {
        return res.status(400).json({ error: "Facebook rejected the request. Please check if the URL is correct." });
      }
      if (status === 403 || status === 429) {
        return res.status(502).json({ error: "Facebook blocked the lookup request from the server. Please try again later." });
      }
      return res.status(500).json({ error: "Failed to fetch profile. Please check the URL and try again." });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
