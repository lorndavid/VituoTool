import { lookupFacebookUid, normalizeFacebookUrl } from "../lib/facebookUid.ts";

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  setHeader(name: string, value: string | string[]): void;
  status(code: number): ApiResponse;
  json(body: unknown): void;
  end(body?: string): void;
};

function getUrlFromBody(body: unknown) {
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      return typeof parsed?.url === "string" ? parsed.url : "";
    } catch {
      return "";
    }
  }

  if (body && typeof body === "object" && "url" in body) {
    const url = (body as { url?: unknown }).url;
    return typeof url === "string" ? url : "";
  }

  return "";
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Allow", ["POST"]);

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const url = getUrlFromBody(req.body);
  if (!url) {
    res.status(400).json({ error: "URL is required" });
    return;
  }

  const normalizedUrl = normalizeFacebookUrl(url);

  try {
    const uid = await lookupFacebookUid(normalizedUrl);

    if (!uid) {
      res.status(404).json({
        error: "Could not find UID. The profile might be private or protected.",
      });
      return;
    }

    res.status(200).json({ uid });
  } catch (error: any) {
    console.error("Vercel lookup error details:", error.response?.status, error.message);

    if (error.response?.status === 400) {
      res.status(400).json({
        error: "Facebook rejected the request. Please check if the URL is correct.",
      });
      return;
    }

    res.status(500).json({
      error: "Failed to fetch profile. Please check the URL and try again.",
    });
  }
}
