import axios from "axios";

let cachedBatches: any[] | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export async function getCachedBatches(): Promise<any[]> {
  const now = Date.now();
  if (cachedBatches && (now - lastCacheTime < CACHE_DURATION)) {
    console.log("[batchesCache] Returning cached batches");
    return cachedBatches;
  }

  console.log("[batchesCache] Fetching batches from external API: https://api.pimaxer.in/v2/batches");
  const response = await axios.get("https://api.pimaxer.in/v2/batches", {
    timeout: 10000,
  });

  const rawData = response.data;
  let rawBatches: any[] = [];
  if (rawData) {
    if (Array.isArray(rawData)) {
      rawBatches = rawData;
    } else if (Array.isArray(rawData.data)) {
      rawBatches = rawData.data;
    } else if (Array.isArray(rawData.batches)) {
      rawBatches = rawData.batches;
    }
  }

  cachedBatches = rawBatches;
  lastCacheTime = now;
  return rawBatches;
}
