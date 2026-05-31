import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { authenticateUser } from "@/utils/authenticateUser";

const ALLOWED_HOSTS = [
  "cdn.pw.live",
  "cdn1.pw.live",
  "cdn2.pw.live",
  "physicswallah.live",
  "www.physicswallah.live",
  "api.penpencil.co",
  "d1d34p8vz63oiq.cloudfront.net",
  "d26g5bnklkwsh4.cloudfront.net",
  "storage.googleapis.com",
];

function isAllowedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith("." + host)
    );
  } catch {
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await authenticateUser(req, res);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Missing or invalid url parameter." });
  }

  if (!isAllowedUrl(url)) {
    return res.status(403).json({ error: "URL not allowed." });
  }

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://physicswallah.live/",
        Origin: "https://physicswallah.live",
      },
      timeout: 15000,
    });

    const contentType = response.headers["content-type"] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=3600");

    return res.status(200).send(Buffer.from(response.data));
  } catch (error: any) {
    console.error("Proxy error for URL:", url, error.message);
    const status = error.response?.status || 500;
    return res.status(status).json({
      error: `Proxy failed fetching target: ${error.message}`,
    });
  }
}
