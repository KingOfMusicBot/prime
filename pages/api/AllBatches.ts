import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { authenticateUser } from "@/utils/authenticateUser";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { page = "1" } = req.query;
  const pageNum = parseInt(page as string, 10);

  if (isNaN(pageNum) || pageNum <= 0) {
    return res.status(400).json({ message: "Invalid page parameter" });
  }

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

    // Map fields for full backward compatibility and new metadata requirements
    const mappedBatches = rawBatches.map((item: any) => ({
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

    const FIXED_LIMIT = 12;
    const skip = (pageNum - 1) * FIXED_LIMIT;
    const total = mappedBatches.length;
    const paginatedData = mappedBatches.slice(skip, skip + FIXED_LIMIT);

    return res.status(200).json({
      success: true,
      currentPage: pageNum,
      totalPages: Math.ceil(total / FIXED_LIMIT),
      totalItems: total,
      data: paginatedData,
    });
  } catch (err: any) {
    console.error("AllBatches error:", err);
    return res.status(500).json({ message: err.message || "Internal Server Error" });
  }
}
