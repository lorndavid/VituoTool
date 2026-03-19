import axios from "axios";
import * as cheerio from "cheerio";

export function normalizeFacebookUrl(inputUrl: string) {
  if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
    return `https://${inputUrl}`;
  }

  return inputUrl;
}

function toMobileFacebookUrl(inputUrl: string) {
  const parsed = new URL(inputUrl);

  if (parsed.hostname === "facebook.com" || parsed.hostname === "www.facebook.com") {
    parsed.hostname = "m.facebook.com";
  }

  return parsed.toString();
}

async function fetchUid(targetUrl: string) {
  const response = await axios.get(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
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
    /&quot;userID&quot;:&quot;(\d+)&quot;/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  const metaUid =
    $('meta[property="al:android:url"]').attr("content") ||
    $('meta[property="al:ios:url"]').attr("content");

  if (metaUid) {
    const match = metaUid.match(/fb:\/\/profile\/(\d+)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export async function lookupFacebookUid(inputUrl: string) {
  const normalizedUrl = normalizeFacebookUrl(inputUrl);

  let uid = await fetchUid(normalizedUrl);

  if (!uid) {
    const mobileUrl = toMobileFacebookUrl(normalizedUrl);
    if (mobileUrl !== normalizedUrl) {
      uid = await fetchUid(mobileUrl);
    }
  }

  return uid;
}
