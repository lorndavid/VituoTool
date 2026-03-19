import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to lookup Facebook UID
  app.post("/api/lookup-uid", async (req, res) => {
    let { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Normalize URL
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    try {
      console.log(`Looking up UID for URL: ${url}`);
      
      const fetchUid = async (targetUrl: string) => {
        const response = await axios.get(targetUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          },
          timeout: 10000,
        });

        const html = response.data;
        const $ = cheerio.load(html);

        const patterns = [
          /fb:\/\/profile\/(\d+)/,
          /"entity_id":"(\d+)"/,
          /userID:"(\d+)"/,
          /content="fb:\/\/profile\/(\d+)"/,
          /"userID":"(\d+)"/,
          /target_id=(\d+)/,
          /profile_id=(\d+)/,
          /id=(\d+)/,
          /&quot;id&quot;:&quot;(\d+)&quot;/,
          /&quot;userID&quot;:&quot;(\d+)&quot;/
        ];

        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match && match[1]) return match[1];
        }

        const metaUid = $('meta[property="al:android:url"]').attr('content') || 
                        $('meta[property="al:ios:url"]').attr('content');
        if (metaUid) {
          const match = metaUid.match(/fb:\/\/profile\/(\d+)/);
          if (match) return match[1];
        }

        return null;
      };

      let uid = await fetchUid(url);

      // Fallback to mobile site if not found
      if (!uid && !url.includes("m.facebook.com")) {
        const mobileUrl = url.replace("www.facebook.com", "m.facebook.com").replace("facebook.com", "m.facebook.com");
        console.log(`Fallback to mobile URL: ${mobileUrl}`);
        uid = await fetchUid(mobileUrl);
      }

      if (uid) {
        console.log(`Found UID: ${uid}`);
        return res.json({ uid });
      } else {
        console.warn(`Could not find UID for URL: ${url}`);
        return res.status(404).json({ error: "Could not find UID. The profile might be private or protected." });
      }
    } catch (error: any) {
      console.error("Lookup error details:", error.response?.status, error.message);
      if (error.response?.status === 400) {
        return res.status(400).json({ error: "Facebook rejected the request. Please check if the URL is correct." });
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
