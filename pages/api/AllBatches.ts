import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateUser } from "@/utils/authenticateUser";
import { getCachedBatches } from "@/utils/batchesCache";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";

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
    await dbConnect();

    // Fetch batches from the cache
    const rawBatches = await getCachedBatches();

    // Fetch local batches from database
    const localBatches = await Batch.find({}).lean().exec();

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

    const mappedLocal = (localBatches || []).map((item: any) => ({
      _id: item.batchId || item._id,
      batchId: item.batchId || "",
      batchName: item.batchName || "Unnamed Batch",
      batchImage: item.batchImage || "/assets/img/video-placeholder.svg",
      language: item.language || "Hinglish",
      template: item.template || "NORMAL",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      batchPrice: item.batchPrice || 0,
      byName: item.byName || "",

      id: item.batchId || "",
      name: item.batchName || "",
      pngUrl: item.batchImage || "",
      hasMultiplePlans: !!item.hasMultiplePlans,
      cohort: item.byName || "",
      medium: item.language || "",
      exam: item.exam || "",
      startsOn: item.startDate || "",
      actualPrice: item.batchPrice || 0,
      offPrice: item.batchPrice || 0,
      createdAt: item.createdAt || "",
    }));

    const mergedMap = new Map();
    mappedBatches.forEach((b: any) => mergedMap.set(String(b.batchId), b));
    mappedLocal.forEach((b: any) => mergedMap.set(String(b.batchId), b));

    const mergedBatches = Array.from(mergedMap.values());

    const FIXED_LIMIT = 12;
    const skip = (pageNum - 1) * FIXED_LIMIT;
    const total = mergedBatches.length;
    const paginatedData = mergedBatches.slice(skip, skip + FIXED_LIMIT);

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
