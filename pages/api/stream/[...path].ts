import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { authenticateUser } from "@/utils/authenticateUser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Authenticate user before proxying stream
    await authenticateUser(req, res);
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { path } = req.query;
  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: "Invalid path" });
  }

  const relativePath = path.join("/");
  const targetUrl = `https://stream.pimaxer.in/${relativePath}`;

  try {
    const response = await axios.get(targetUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": req.headers["user-agent"] || "",
      },
      timeout: 20000,
    });

    const contentType = response.headers["content-type"] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    // Check if it is a playlist manifest (.m3u8, .mpd) or text-based config
    const isManifest =
      relativePath.endsWith(".m3u8") ||
      relativePath.endsWith(".mpd") ||
      contentType.includes("mpegurl") ||
      contentType.includes("dash+xml") ||
      contentType.includes("xml") ||
      contentType.includes("text");

    if (isManifest) {
      let text = Buffer.from(response.data).toString("utf-8");

      // Replace absolute host URLs with our relative proxy endpoint
      text = text.replace(/https:\/\/stream\.pimaxer\.in/g, "/api/stream");
      text = text.replace(/http:\/\/stream\.pimaxer\.in/g, "/api/stream");

      // Replace any attribute URLs that start with a leading slash to route through /api/stream
      text = text.replace(/(href|media|initialization|sourceURL|URI)=(['"])\/+(?!api\/stream)/g, '$1=$2/api/stream/');

      // Replace start-of-line URIs that start with a leading slash in HLS playlists
      let lines = text.split("\n");
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.startsWith("/") && !line.startsWith("/api/stream")) {
          lines[i] = "/api/stream" + lines[i];
        }
      }
      text = lines.join("\n");

      return res.status(200).send(text);
    }

    // Otherwise, return raw binary segment data (.ts, .m4s, etc.)
    return res.status(200).send(Buffer.from(response.data));
  } catch (error: any) {
    console.error(`Stream proxy failed for path ${relativePath}:`, error.message);
    const status = error.response?.status || 500;
    return res.status(status).json({ error: error.message });
  }
}
