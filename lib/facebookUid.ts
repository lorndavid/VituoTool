export function normalizeFacebookUrl(inputUrl: string) {
  const normalizedInput = inputUrl.trim();

  if (!normalizedInput.startsWith("http://") && !normalizedInput.startsWith("https://")) {
    return `https://${normalizedInput}`;
  }

  return normalizedInput;
}

function toMobileFacebookUrl(inputUrl: string) {
  const parsed = new URL(inputUrl);

  if (parsed.hostname === "facebook.com" || parsed.hostname === "www.facebook.com") {
    parsed.hostname = "m.facebook.com";
  }

  return parsed.toString();
}

async function fetchUid(targetUrl: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
    redirect: "follow",
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const error = new Error(`Facebook request failed with status ${response.status}`) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  const html = await response.text();

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
    /<meta[^>]+property=["']al:(?:android|ios):url["'][^>]+content=["']fb:\/\/profile\/(\d+)["']/i,
    /<meta[^>]+content=["']fb:\/\/profile\/(\d+)["'][^>]+property=["']al:(?:android|ios):url["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
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
