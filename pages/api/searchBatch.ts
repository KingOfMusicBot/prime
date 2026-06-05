import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { authenticateUser } from "@/utils/authenticateUser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { name, page = "1" } = req.query;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Missing or invalid `name` query" });
  }

  const limit = 12;
  const currentPage = parseInt(page as string, 10);
  const skip = (currentPage - 1) * limit;

  try {
    // Authenticate user before querying
    await authenticateUser(req, res);

    // Fetch batches from the Pimaxer v2 API
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

    // Filter by name (case-insensitive)
    const filteredRaw = rawBatches.filter((item: any) =>
      String(item.name || "").toLowerCase().includes(name.toLowerCase())
    );

    // Map fields for full backward compatibility and new metadata requirements
    const mappedBatches = filteredRaw.map((item: any) => ({
      _id: item.id || String(Math.random()),
      batchId: item.id || "",
      batchName: item.name || "Unnamed Batch",
      batchImage: item.pngUrl || "/assets/img/video-placeholder.svg",
      language: item.medium || "Hinglish",
      template: "NORMAL",
      startDate: item.startsOn || "",
      endDate: item.startsOn || "",
      batchPrice: item.offPrice || 0,
      byName: item.cohort || "",

      // New properties requested by the user
      id: item.id || "",
      name: item.name || "",
      pngUrl: item.pngUrl || "",
      hasMultiplePlans: !!item.hasMultiplePlans,
      cohort: item.cohort || "",
      medium: item.medium || "",
      exam: item.exam || "",
      startsOn: item.startsOn || "",
      actualPrice: typeof item.actualPrice === "number" ? item.actualPrice : 0,
      offPrice: typeof item.offPrice === "number" ? item.offPrice : 0,
      createdAt: item.createdAt || "",
    }));

    const totalItems = mappedBatches.length;
    const paginatedData = mappedBatches.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      data: paginatedData,
      currentPage,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
    });
  } catch (error: any) {
    console.error("searchBatch error:", error);
    return res.status(500).json({ message: "Error While Searching Batches" });
  }
}
