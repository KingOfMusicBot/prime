// lib/utils/directMediaDownloader.ts
import { toast } from "sonner";

interface DownloadProgressCallback {
  (progress: number, statusText: string): void;
}

// Convert Hex string to ArrayBuffer for Web Crypto IV
function hexStringToArrayBuffer(hexString: string): ArrayBuffer {
  const cleanHex = hexString.replace(/^0x/i, "");
  const result = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    result[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return result.buffer;
}

// Convert a number (segment sequence number) to a 16-byte IV ArrayBuffer
function sequenceNumberToIV(seq: number): ArrayBuffer {
  const iv = new Uint8Array(16);
  // HLS spec says the 1-based sequence number should be the big-endian representation in the last 4 bytes
  iv[12] = (seq >> 24) & 0xff;
  iv[13] = (seq >> 16) & 0xff;
  iv[14] = (seq >> 8) & 0xff;
  iv[15] = seq & 0xff;
  return iv.buffer;
}

// Decrypt AES-128 segment
async function decryptSegment(
  encryptedData: ArrayBuffer,
  keyData: ArrayBuffer,
  iv: ArrayBuffer
): Promise<ArrayBuffer> {
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );

  return await window.crypto.subtle.decrypt(
    { name: "AES-CBC", iv: new Uint8Array(iv) },
    cryptoKey,
    encryptedData
  );
}

// Helper to proxy requests through our server to bypass CORS constraints
function getProxyUrl(targetUrl: string): string {
  return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
}

// Helper to append/merge signed query parameters to a URL safely
function appendSignedParams(url: string, signedParams: string): string {
  if (!signedParams) return url;
  try {
    const paramsToAppend = new URLSearchParams(signedParams);
    const urlObj = new URL(url);
    paramsToAppend.forEach((value, key) => {
      if (!urlObj.searchParams.has(key)) {
        urlObj.searchParams.set(key, value);
      }
    });
    return urlObj.toString();
  } catch (err) {
    console.warn("Failed to parse URL for appending signed params:", url, err);
    // Fallback manual append
    const separator = url.includes("?") ? "&" : "?";
    const cleanParams = signedParams.replace(/^\?/, "");
    return `${url}${separator}${cleanParams}`;
  }
}

// Helper to safely get directory base of a URL (even with query params)
function getBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf("/") + 1);
  } catch (err) {
    console.warn("Failed to parse URL for base path calculation:", url, err);
    const queryIdx = url.indexOf("?");
    const pathPart = queryIdx !== -1 ? url.substring(0, queryIdx) : url;
    return pathPart.substring(0, pathPart.lastIndexOf("/") + 1);
  }
}

// Main downloader function
export async function downloadHlsStream(
  playlistUrl: string,
  fileName: string,
  targetHeight: number | null,
  onProgress: DownloadProgressCallback,
  onSegmentDownloaded?: (bytes: number, index: number, total: number) => void
): Promise<Blob> {
  onProgress(1, "Fetching playlist...");

  // Extract query parameters to preserve signature token across child playlists and segments
  const queryIndex = playlistUrl.indexOf("?");
  const signedParams = queryIndex !== -1 ? playlistUrl.substring(queryIndex) : "";

  // Dynamic Decryption Key Extraction from equivalent DASH manifest (bypasses CDN main.key fetch issues)
  let extractedDecryptionKey: ArrayBuffer | null = null;
  try {
    const mpdUrl = playlistUrl.replace(/\.m3u8(\?|$)/i, '.mpd$1').replace('/master.m3u8', '/master.mpd');
    const mpdRes = await fetch(getProxyUrl(mpdUrl));
    if (mpdRes.ok) {
      const mpdText = await mpdRes.text();
      const kidMatch = mpdText.match(/default_KID=["']([a-f0-9\-]+)["']/i);
      if (kidMatch) {
        const kid = kidMatch[1].replace(/[-]/g, "").toLowerCase();
        onProgress(3, `Resolving credentials...`);
        const keyRes = await fetch(`/api/get-otp?kid=${kid}`);
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          const hexKey = keyData?.clearKeys?.[kid];
          if (hexKey) {
            extractedDecryptionKey = hexStringToArrayBuffer(hexKey);
            onProgress(4, "Decryption keys successfully verified");
          }
        }
      }
    }
  } catch (err) {
    console.warn("Failed to extract decryption key from DASH manifest:", err);
  }

  // 1. Fetch the master playlist
  const res = await fetch(getProxyUrl(playlistUrl));
  if (!res.ok) throw new Error("Failed to fetch playlist manifest");
  let playlistText = await res.text();

  let targetPlaylistUrl = playlistUrl;
  const baseUrl = getBaseUrl(playlistUrl);

  // 2. Parse master playlist if multi-variant
  if (playlistText.includes("#EXT-X-STREAM-INF")) {
    const lines = playlistText.split("\n");
    let bestVariantUrl = "";
    let closestHeightDiff = Infinity;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#EXT-X-STREAM-INF")) {
        // Parse resolution (e.g. RESOLUTION=1280x720)
        const resMatch = line.match(/RESOLUTION=(\d+)x(\d+)/i);
        const height = resMatch ? parseInt(resMatch[2]) : 0;

        let nextLine = lines[i + 1]?.trim();
        while (nextLine === "") {
          i++;
          nextLine = lines[i + 1]?.trim();
        }

        if (nextLine && !nextLine.startsWith("#")) {
          // Resolve relative or absolute URL
          let segmentUrl = nextLine.startsWith("http") ? nextLine : baseUrl + nextLine;
          segmentUrl = appendSignedParams(segmentUrl, signedParams);

          if (targetHeight === null) {
            // Default to highest quality
            if (height > (bestVariantUrl ? closestHeightDiff : 0)) {
              bestVariantUrl = segmentUrl;
              closestHeightDiff = height;
            }
          } else {
            const diff = Math.abs(height - targetHeight);
            if (diff < closestHeightDiff) {
              closestHeightDiff = diff;
              bestVariantUrl = segmentUrl;
            }
          }
        }
      }
    }

    if (bestVariantUrl) {
      targetPlaylistUrl = bestVariantUrl;
      const subRes = await fetch(getProxyUrl(targetPlaylistUrl));
      if (!subRes.ok) throw new Error("Failed to fetch sub-playlist manifest");
      playlistText = await subRes.text();
    }
  }

  const segmentBaseUrl = getBaseUrl(targetPlaylistUrl);
  const lines = playlistText.split("\n");

  interface SegmentInfo {
    url: string;
    sequence: number;
    keyUri: string | null;
    keyIv: ArrayBuffer | null;
  }

  const segments: SegmentInfo[] = [];
  let currentKeyUri: string | null = null;
  let currentKeyIv: ArrayBuffer | null = null;
  let sequenceCount = 0;

  // 3. Parse segments and encryption keys
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXT-X-KEY")) {
      onProgress(5, `Manifest Key Tag: ${line}`);
      // Parse key details: #EXT-X-KEY:METHOD=AES-128,URI="key_url",IV=0x...
      const methodMatch = line.match(/METHOD=([^,\s]+)/i);
      const uriMatch = line.match(/URI=["']([^"']+)["']/i);
      const ivMatch = line.match(/IV=([^,\s]+)/i);

      if (methodMatch && methodMatch[1].toUpperCase() === "AES-128" && uriMatch) {
        let keyUri = uriMatch[1].startsWith("http") ? uriMatch[1] : segmentBaseUrl + uriMatch[1];
        keyUri = appendSignedParams(keyUri, signedParams);
        currentKeyUri = keyUri;
        currentKeyIv = ivMatch ? hexStringToArrayBuffer(ivMatch[1]) : null;
      } else {
        currentKeyUri = null;
        currentKeyIv = null;
      }
    } else if (line.startsWith("#EXTINF")) {
      let nextLine = lines[i + 1]?.trim();
      while (nextLine === "") {
        i++;
        nextLine = lines[i + 1]?.trim();
      }

      if (nextLine && !nextLine.startsWith("#")) {
        let segUrl = nextLine.startsWith("http") ? nextLine : segmentBaseUrl + nextLine;
        segUrl = appendSignedParams(segUrl, signedParams);
        sequenceCount++;
        segments.push({
          url: segUrl,
          sequence: sequenceCount,
          keyUri: currentKeyUri,
          keyIv: currentKeyIv || sequenceNumberToIV(sequenceCount),
        });
      }
    }
  }

  if (segments.length === 0) {
    throw new Error("No media segments found in the playlist");
  }

  onProgress(5, `Found ${segments.length} segments. Pre-processing decryption...`);

  // Key Cache to avoid multiple HTTP requests for the same decryption key
  const keyCache: Record<string, ArrayBuffer> = {};

  // 4. Download and Decrypt segments using a high-concurrency sliding window worker pool
  // Always use the secure local Next.js proxy server for segment downloads since browser direct CDN fetches fail Referer checking
  const decryptedSegments: ArrayBuffer[] = new Array(segments.length);
  const concurrency = 12; // 12 parallel threads to optimize speed while keeping Next.js dev server fully stable
  let activeIndex = 0;
  let completedCount = 0;

  const worker = async () => {
    while (activeIndex < segments.length) {
      const idx = activeIndex++;
      if (idx >= segments.length) break;

      const seg = segments[idx];
      let segData: ArrayBuffer | null = null;
      let lastError: any = null;
      
      // Fetch segment with retry mechanism to handle potential server socket resets
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const segmentUrl = getProxyUrl(seg.url);
          const segRes = await fetch(segmentUrl);
          if (segRes.ok) {
            segData = await segRes.arrayBuffer();
            break;
          }
          lastError = new Error(`HTTP ${segRes.status}`);
        } catch (err: any) {
          lastError = err;
        }
        // Exponential backoff wait
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }

      if (!segData) {
        throw new Error(`Failed to download segment ${idx + 1} after 3 attempts: ${lastError?.message || "Unknown error"}`);
      }

      if (onSegmentDownloaded) {
        onSegmentDownloaded(segData.byteLength, idx + 1, segments.length);
      }

      // Decrypt if encrypted
      if (seg.keyUri) {
        let decryptionKey = extractedDecryptionKey || keyCache[seg.keyUri];
        if (!decryptionKey) {
          // Check if key URI contains key ID (KID) parameter to load directly from local OTP handler
          const kidMatch = seg.keyUri.match(/kid=([a-f0-9\-]+)/i);
          const kid = kidMatch ? kidMatch[1].replace(/[-]/g, "").toLowerCase() : null;

          if (kid) {
            const keyRes = await fetch(`/api/get-otp?kid=${kid}`);
            if (!keyRes.ok) throw new Error("Failed to fetch decryption key");
            const keyData = await keyRes.json();
            const hexKey = keyData?.clearKeys?.[kid];
            if (!hexKey) throw new Error("Decryption key not found in server response");
            decryptionKey = hexStringToArrayBuffer(hexKey);
          } else {
            const keyRes = await fetch(getProxyUrl(seg.keyUri));
            if (!keyRes.ok) throw new Error("Failed to fetch decryption key");
            decryptionKey = await keyRes.arrayBuffer();
          }
          keyCache[seg.keyUri] = decryptionKey;
        }

        if (seg.keyIv) {
          segData = await decryptSegment(segData, decryptionKey, seg.keyIv);
        }
      }

      decryptedSegments[idx] = segData;
      completedCount++;

      const currentProgress = Math.round(5 + (completedCount / segments.length) * 90);
      onProgress(currentProgress, `Downloading: ${completedCount}/${segments.length} parts...`);
    }
  };

  // Launch workers
  const workers = Array.from({ length: Math.min(concurrency, segments.length) }, worker);
  await Promise.all(workers);

  onProgress(97, "Merging and packaging file...");

  // 5. Package as single Blob
  const blobType = fileName.endsWith(".mp3") ? "audio/mp3" : "video/mp4";
  
  let finalData: ArrayBuffer[] = decryptedSegments;
  
  if (blobType === "video/mp4") {
    try {
      onProgress(98, "Converting media container to standard MP4...");
      // @ts-ignore
      const muxjs = await import("mux.js");
      const mux = muxjs.default || muxjs;
      const transmuxer = new mux.mp4.Transmuxer();
      const mp4Chunks: Uint8Array[] = [];
      
      transmuxer.on("data", (event: any) => {
        if (event.initSegment) {
          mp4Chunks.push(new Uint8Array(event.initSegment));
        }
        if (event.data) {
          mp4Chunks.push(new Uint8Array(event.data));
        }
      });
      
      for (const seg of decryptedSegments) {
        transmuxer.push(new Uint8Array(seg));
        transmuxer.flush();
      }
      
      if (mp4Chunks.length > 0) {
        finalData = mp4Chunks.map(chunk => chunk.buffer);
        onProgress(99, "✓ Standard MP4 conversion complete");
      } else {
        console.warn("mux.js did not emit any data, falling back to raw TS");
      }
    } catch (muxErr) {
      console.warn("Failed to transmux TS to standard MP4 with mux.js, falling back to raw TS...", muxErr);
    }
  }

  const finalBlob = new Blob(finalData, { type: blobType });

  onProgress(100, "Download complete!");
  return finalBlob;
}

