"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import "../globals.css";
import { toast } from "sonner";

const YouTubePlayer = dynamic(() => import("@/app/components/YouTubePlayer"), {
  ssr: false,
});

const DashPlayer = dynamic(() => import("@/app/components/dashPlayer"), {
  ssr: false,
});

const HLSPlayer = dynamic(() => import("@/app/components/HLSPlayer"), {
  ssr: false,
});

export default function WatchPageClient() {
  const params = useSearchParams();
  const router = useRouter();

  const [videoType, setVideoType] = useState<"youtube" | "penpencilvdo" | "hls" | null>(
    null
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [clearKeys, setClearKeys] = useState<any>(null);
  const [signedUrlQuery, setSignedUrlQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [Attachment, setAttachment] = useState<string | null>(null);
  const [isBatchUnavailable, setIsBatchUnavailable] = useState(false);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);
  const [lectureData, setLectureData] = useState<any>(null);

  // Params
  const batchId = params?.get("batchId") || "";
  const subjectId = params?.get("SubjectId") || "";
  const ContentId = params?.get("ContentId") || params?.get("ChildId") || "";
  const offlineUri = params?.get("offlineUri") || "";

  // Revoke blob URL on unmount/change to prevent leaks
  useEffect(() => {
    return () => {
      if (localBlobUrl) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [localBlobUrl]);

  const saveWatchHistory = (lecture: {
    id: string;
    title: string;
    thumbnail: string;
    duration: string;
    batchId: string;
    subjectId: string;
    type: string;
    videoUrl: string;
    isLocked: boolean;
  }) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("watchHistory") || "[]";
      const history = JSON.parse(raw);

      const now = new Date();
      const timeString = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const dateString = now.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });

      const historyItem = {
        ...lecture,
        formattedTime: `${dateString} at ${timeString}`,
        timestamp: now.getTime(),
      };

      const filtered = history.filter((item: any) => item.id !== lecture.id);
      filtered.unshift(historyItem);

      const limited = filtered.slice(0, 4);
      localStorage.setItem("watchHistory", JSON.stringify(limited));
    } catch (err) {
      console.error("Failed to save watch history:", err);
    }
  };

  useEffect(() => {
    if (offlineUri) {
      if (offlineUri.startsWith("local-device-")) {
        const loadLocalOffline = async () => {
          setLoading(true);
          try {
            const { getBlobFromIndexedDB } = await import("@/lib/utils/indexedDBStore");
            const blob = await getBlobFromIndexedDB(offlineUri);
            if (!blob) {
              throw new Error("Offline media file not found in database.");
            }
            const blobUrl = URL.createObjectURL(blob);
            setLocalBlobUrl(blobUrl);
            setVideoType("penpencilvdo");
            setVideoUrl(blobUrl);
          } catch (err: any) {
            console.error("Failed to load local offline video:", err);
            toast.error(err.message || "Failed to load offline file.");
          } finally {
            setLoading(false);
          }
        };
        loadLocalOffline();
      } else {
        setVideoType("penpencilvdo");
        setVideoUrl(offlineUri);
        setLoading(false);
      }
      return;
    }

    if (!batchId || !subjectId || !ContentId) return;

    const fetchVideoData = async () => {
      setLoading(true);
      setIsBatchUnavailable(false);

      try {
        // Step 1: Attempt to load the lecture via Bhanu Yadav's Lecture URL API (Cloudflare Worker)
        let hlsVid: string | null = null;
        try {
          const workerUrl = `https://get-url.bhanuyadav.workers.dev/?parentId=${batchId}&childId=${ContentId}`;
          const workerRes = await fetch(workerUrl);
          
          if (workerRes.ok) {
            const workerData = await workerRes.json();
            // Extract the video ID (vid) from response
            if (workerData && !workerData.error) {
              hlsVid = workerData.vid || workerData.videoId || workerData.video_id || 
                       (workerData.data && (workerData.data.vid || workerData.data.videoId));
            }
          }
        } catch (workerErr) {
          console.warn("Lecture URL API integration request failed. Falling back to default system:", workerErr);
        }

        // Fetch Schedule/Metadata API from Next.js backend concurrently to get metadata
        let scheduleData: any = null;
        try {
          const scheduleRes = await fetch(
            `/api/Schedule?BatchId=${batchId}&SubjectId=${subjectId}&ContentId=${ContentId}`
          );
          if (scheduleRes.ok) {
            scheduleData = await scheduleRes.json();
          }
        } catch (scheduleErr) {
          console.warn("Failed to fetch lecture metadata from Schedule API:", scheduleErr);
        }

        // If a video ID (vid) was successfully extracted, construct and play the HLS stream
        if (hlsVid) {
          const generatedHlsUrl = `https://stream.pimaxer.in/${hlsVid}/master.m3u8`;
          setVideoUrl(generatedHlsUrl);
          setVideoType("hls");

          // Extract metadata details if available from the scheduleData response
          const title = scheduleData?.data?.topic || scheduleData?.data?.videoDetails?.name || "Lecture";
          const thumbnail = scheduleData?.data?.videoDetails?.image || "/assets/img/video-placeholder.svg";
          const duration = scheduleData?.data?.videoDetails?.duration || "";
          const isLocked = scheduleData?.data?.isLocked ?? false;

          const homeworkIds = scheduleData?.data?.homeworkIds?.[0];
          if (homeworkIds?.attachmentIds?.length > 0) {
            const attachment = homeworkIds.attachmentIds[0];
            if (attachment?.baseUrl && attachment?.key) {
              setAttachment(attachment);
            }
          }

          const lectureMeta = {
            id: ContentId,
            title,
            thumbnail,
            duration,
            batchId,
            subjectId,
            type: "hls",
            videoUrl: generatedHlsUrl,
            isLocked,
          };

          saveWatchHistory(lectureMeta);
          setLectureData(lectureMeta);
          setLoading(false);
          return;
        }

        // --- FALLBACK TO ORIGINAL DRM / YOUTUBE FLOW ---
        if (!scheduleData?.success || !scheduleData?.data?.urlType) {
          throw new Error("Invalid Schedule API response");
        }

        const urlType = scheduleData.data.urlType;
        const homeworkIds = scheduleData?.data?.homeworkIds?.[0];

        if (homeworkIds?.attachmentIds?.length > 0) {
          const attachment = homeworkIds.attachmentIds[0];
          if (attachment?.baseUrl && attachment?.key) {
            setAttachment(attachment);
          }
        }

        const url = scheduleData.data.url;

        if (urlType === "youtube") {
          setVideoType("youtube");
          setVideoUrl(url);

          saveWatchHistory({
            id: ContentId,
            title: scheduleData.data.topic || scheduleData.data.videoDetails?.name || "Lecture",
            thumbnail: scheduleData.data.videoDetails?.image || "/assets/img/video-placeholder.svg",
            duration: scheduleData.data.videoDetails?.duration || "",
            batchId,
            subjectId,
            type: "youtube",
            videoUrl: url,
            isLocked: scheduleData.data.isLocked ?? false,
          });
          return;
        }

        if (urlType === "penpencilvdo") {
          setVideoType("penpencilvdo");

          // Step 1: Get Signed URL
          const penRes = await fetch(
            `/api/get-video-url?batchId=${batchId}&subjectId=${subjectId}&childId=${ContentId}`
          );

          if (penRes.status === 403) {
            setIsBatchUnavailable(true);
            return;
          }

          const penData = await penRes.json();

          const finalUrl = penData?.data?.url;
          const signedQuery = penData?.data?.signedUrl;

          if (!finalUrl || !signedQuery) {
            setIsBatchUnavailable(true);
            return;
          }

          const fullMPDUrl = `${finalUrl}${signedQuery}`;

          // Step 2: Fetch MPD and extract default_KID
          const mpdRes = await fetch(fullMPDUrl);
          const mpdText = await mpdRes.text();

          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(mpdText, "application/xml");

          const kidNode = xmlDoc.querySelector(
            'ContentProtection[schemeIdUri="urn:mpeg:dash:mp4protection:2011"]'
          );
          let defaultKID = kidNode?.getAttribute("cenc:default_KID");

          if (!defaultKID) {
            throw new Error("DEFAULT_KID not found in MPD");
          }

          // Normalize the KID
          defaultKID = defaultKID.replace(/-/g, "").toLowerCase();

          // Step 3: Fetch ClearKeys using the default_KID
          const otpRes = await fetch(`/api/get-otp?kid=${defaultKID}`);
          const otpData = await otpRes.json();

          if (!otpData?.clearKeys) {
            throw new Error("Missing clearKeys in OTP response");
          }

          // Step 4: Set state with everything
          setVideoUrl(finalUrl);
          setSignedUrlQuery(signedQuery);
          setClearKeys(otpData?.clearKeys);
          setVideoType("penpencilvdo");

          const lectureMeta = {
            id: ContentId,
            title: scheduleData.data.topic || scheduleData.data.videoDetails?.name || "Lecture",
            thumbnail: scheduleData.data.videoDetails?.image || "/assets/img/video-placeholder.svg",
            duration: scheduleData.data.videoDetails?.duration || "",
            batchId,
            subjectId,
            type: "penpencilvdo",
            videoUrl: finalUrl,
            isLocked: scheduleData.data.isLocked ?? false,
          };
          saveWatchHistory(lectureMeta);
          setLectureData(lectureMeta);
        } else {
          setVideoType(null);
        }
      } catch (err: any) {
        console.error("Video setup failed:", err);
        let message = "Unknown error";
        if (typeof err === "string") message = err;
        else if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") message = (err as any).message;

        if (
          message.toLowerCase().includes("unavailable") ||
          message.toLowerCase().includes("contact admin") ||
          message.toLowerCase().includes("forbidden") ||
          message.toLowerCase().includes("403")
        ) {
          setIsBatchUnavailable(true);
        } else {
          toast.error(`${message} - Try refreshing the page!`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [batchId, subjectId, ContentId]);

  // ✅ Auto-rotate to landscape for all video types
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;

      if (isFullscreen && (screen.orientation && typeof (screen.orientation as any).lock === "function")) {
        (screen.orientation as any).lock("landscape").catch((err: unknown) => {
          console.warn("Orientation lock failed:", err);
        });
      } else if (screen.orientation?.unlock) {
        screen.orientation.unlock?.();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <div className="h-[100%] md:overflow-auto lg:overflow-hidden select-none">
      <div className="relative" style={{ height: "100%" }}>
        {loading && <div className="text-center p-4">Loading video...</div>}

        {!loading && !isBatchUnavailable && videoType === "youtube" && videoUrl && (
          <YouTubePlayer videoId={extractYouTubeVideoId(videoUrl)} ContentId={ContentId} />
        )}

        {!loading && !isBatchUnavailable && videoType === "hls" && videoUrl && (
          <HLSPlayer
            baseUrl={videoUrl}
            signedQuery=""
            attachment={Attachment || undefined}
          />
        )}

        {!loading && !isBatchUnavailable && videoType === "penpencilvdo" && videoUrl && (clearKeys || offlineUri) ? (
          <DashPlayer
            src={videoUrl}
            type="dash"
            Attachment={Attachment || undefined}
            signedUrlQuery={signedUrlQuery}
            drmConfig={clearKeys ? { clearKeys } : undefined}
            ContentId={ContentId}
            isOffline={!!offlineUri}
            lectureData={lectureData}
          />
        ) : !loading && (videoType === null || isBatchUnavailable) ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] h-full p-6 text-center bg-gradient-to-br from-[#eef7f0] via-[#e4f6e8] to-[#f5f8ff] dark:from-[#0F1908] dark:via-[#1C2B22] dark:to-[#151D1A] transition-colors duration-300">
            <div className="w-full max-w-md p-8 rounded-2xl bg-white/80 dark:bg-[#1c2b22]/80 backdrop-blur-md shadow-xl border border-red-500/10 flex flex-col items-center animate-scaleIn">
              <Heart className="w-16 h-16 text-red-500 fill-red-500 animate-pulse mb-4 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 leading-snug">
                This batch is unavailable. Ask your friend to donate this.
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                If your friend has this batch, then login here and that batch will be automatically added.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      sessionStorage.setItem("donate_batch_id", batchId);
                    }
                    router.push("/study/donate");
                  }}
                  className="px-6 py-2.5 spring-btn-primary flex items-center justify-center gap-2 shadow-md"
                >
                  <Heart size={15} fill="#ffffff" />
                  Donate Batch
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-300 active:scale-95"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Extract YouTube video ID helper
function extractYouTubeVideoId(url: string): string {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.slice(1);
    }

    const vParam = parsedUrl.searchParams.get("v");
    if (vParam && vParam.length === 11) {
      return vParam;
    }

    const match = parsedUrl.pathname.match(
      /\/(embed|v|shorts)\/([a-zA-Z0-9_-]{11})/
    );
    if (match && match[2]) {
      return match[2];
    }

    return "";
  } catch {
    return "";
  }
}
