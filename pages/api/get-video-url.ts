import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import Batch from "@/models/Batch";
import { getVideoHeaders } from "@/utils/auth";
import dbConnect from "@/lib/mongodb";
import { authenticateUser } from "@/utils/authenticateUser";
import User from "@/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { batchId, subjectId, childId } = req.query;

  try {
    const PW_API = process.env.PW_API;
    await dbConnect();

    const user = await authenticateUser(req, res);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!batchId || !subjectId || !childId) {
      return res.status(400).json({
        message: "`batchId`, `subjectId`, and `childId` are required",
      });
    }

    let batch = await Batch.findOne({ batchId });

    if (!batch) {
      const enrolledBatches = Array.isArray(user.enrolledBatches)
        ? user.enrolledBatches
        : [];
      const userEnrollment = enrolledBatches.find(
        (b: any) => b.batchId === String(batchId)
      );

      if (userEnrollment) {
        const { v4: uuidv4 } = await import("uuid");
        batch = await Batch.create({
          batchId: String(batchId),
          batchName: userEnrollment.name || "Unknown Batch",
          batchPrice: 0,
          batchImage: "",
          template: "NORMAL",
          BatchType: "FREE",
          language: "Hinglish",
          byName: "",
          startDate: "",
          endDate: "",
          batchStatus: true,
          enrolledTokens: [
            {
              ownerId: user._id,
              accessToken: user.ActualToken,
              refreshToken: user.ActualRefresh,
              tokenStatus: true,
              randomId: user.randomId || uuidv4(),
              updatedAt: new Date(),
            }
          ]
        });
      } else {
        return res.status(404).json({ message: "Batch not found" });
      }
    }

    const enrolledBatches = Array.isArray(user.enrolledBatches)
      ? user.enrolledBatches
      : [];
    const isEnrolled = enrolledBatches.some(
      (b: any) => b.batchId === String(batchId)
    );
    const userOwnsBatchToken = Array.isArray(batch.enrolledTokens)
      ? batch.enrolledTokens.some(
          (token: any) => String(token?.ownerId) === String(user._id)
        )
      : false;

    if (!isEnrolled && !userOwnsBatchToken) {
      return res.status(403).json({ message: "You are not enrolled in this batch" });
    }

    // Ensure the current user's valid token is registered in batch.enrolledTokens if enrolled
    if (isEnrolled && user.ActualToken) {
      const { v4: uuidv4 } = await import("uuid");
      const tokenIdx = batch.enrolledTokens.findIndex(
        (t: any) => String(t.ownerId) === String(user._id)
      );
      const enrolledToken = {
        ownerId: user._id,
        accessToken: user.ActualToken,
        refreshToken: user.ActualRefresh,
        tokenStatus: true,
        randomId: user.randomId || uuidv4(),
        updatedAt: new Date(),
      };
      if (tokenIdx !== -1) {
        batch.enrolledTokens[tokenIdx] = enrolledToken;
      } else {
        batch.enrolledTokens.push(enrolledToken);
      }
      await batch.save();
    }

    // Self-heal missing enrollment mapping for existing valid owners.
    if (!isEnrolled && userOwnsBatchToken) {
      user.enrolledBatches = enrolledBatches;
      user.enrolledBatches.push({
        batchId: String(batchId),
        name: (batch as any).batchName || "Batch",
      });
      await user.save();
    }

    const tokensToTry = Array.isArray(batch.enrolledTokens)
      ? [...batch.enrolledTokens]
      : [];
    console.log(`Debug: Processing batch ${batchId}. Found ${tokensToTry.length} tokens.`);

    const container = req.query.container || "DASH";

    for (const token of tokensToTry) {
      if (!token.accessToken || !token.randomId) {
        continue;
      }

      try {
        const url = `${PW_API}v1/videos/video-url-details?type=BATCHES&videoContainerType=${container}&reqType=query&childId=${childId}&parentId=${batchId}&clientVersion=201`;
        const headers = getVideoHeaders(token.accessToken, token.randomId);
        const response = await axios.get(url, { headers });

        return res.status(200).json(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.warn(
            `Token for owner ${token.ownerId} failed for batch ${batchId}. Removing it.`
          );

          await Batch.updateOne(
            { _id: batch._id },
            {
              $pull: {
                enrolledTokens: { ownerId: token.ownerId },
              },
            }
          );

          if (token.ownerId) {
            await User.updateOne(
              { _id: token.ownerId },
              { $pull: { enrolledBatches: { batchId: String(batchId) } } }
            );
          }
          continue;
        } else {
          const status = error.response?.status || 500;
          return res.status(status).json({
            success: false,
            message:
              error.response?.data?.message ||
              error.message ||
              "Something went wrong",
          });
        }
      }
    }

    return res.status(403).json({
      success: false,
      message:
        "This Batch is unavailable. Please contact admin to add this batch.",
    });
  } catch (error: any) {
    console.error("Outer error in get-video-url:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected server error occurred",
    });
  }
}
