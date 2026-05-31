"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import * as shaka from "shaka-player";
import { useDownloadStore } from "@/lib/store/useDownloadStore";

export default function GlobalDownloadManager() {
  const queue = useDownloadStore((state) => state.queue);
  const activeDownload = useDownloadStore((state) => state.activeDownload);
  const popQueue = useDownloadStore((state) => state.popQueue);
  const setActiveDownload = useDownloadStore((state) => state.setActiveDownload);
  const setProgress = useDownloadStore((state) => state.setProgress);
  const setCompletedDownloads = useDownloadStore((state) => state.setCompletedDownloads);

  const processingRef = useRef(false);
  const wakeLockRef = useRef<any>(null);

  // Request Wake Lock
  const requestWakeLock = async () => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await (navigator.wakeLock as any).request("screen");
      console.log("Wake Lock acquired successfully");
    } catch (err) {
      console.error("Failed to acquire Wake Lock:", err);
    }
  };

  // Release Wake Lock
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log("Wake Lock released successfully");
      } catch (err) {
        console.error("Failed to release Wake Lock:", err);
      }
    }
  };

  // Re-request wake lock if app becomes visible again during active download
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && activeDownload && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [activeDownload]);

  // Robust notification dispatcher using SW registration for foreground & background support
  const sendNotification = async (title: string, body: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification(title, {
            body,
            icon: "/logo.png",
            badge: "/logo.png",
            tag: "download-notification",
            vibrate: [100, 50, 100],
          });
          return;
        } catch (err) {
          console.error("SW notification failed, falling back to Web Notification:", err);
        }
      }

      // Fallback to standard web notification
      new Notification(title, {
        body,
        icon: "/logo.png",
      });
    }
  };
  
  // Load initial downloads on mount
  useEffect(() => {
    loadCompletedDownloads();
  }, []);

  // Process Queue
  useEffect(() => {
    if (!processingRef.current && queue.length > 0 && !activeDownload) {
      processNextDownload();
    }
  }, [queue, activeDownload]);

  const loadCompletedDownloads = async () => {
    if (typeof window === "undefined" || !shaka.Player.isBrowserSupported()) return;
    let storage: any = null;
    try {
      storage = new shaka.offline.Storage();
      const list = await storage.list();
      list.sort((a, b) => {
        const timeA = a.appMetadata?.downloadedAt || 0;
        const timeB = b.appMetadata?.downloadedAt || 0;
        return timeB - timeA;
      });
      setCompletedDownloads(list);
    } catch (err) {
      console.error("Failed to load downloads:", err);
    } finally {
      if (storage) await storage.destroy();
    }
  };

  const processNextDownload = async () => {
    const next = popQueue();
    if (!next) return;

    processingRef.current = true;
    setActiveDownload(next);
    setProgress(0, "Calculating...", "0 MB/s");

    const title = next.appMetadata?.lectureData?.title || next.appMetadata?.lectureData?.topic || "Video";
    const toastId = `download-${next.contentId || Date.now()}`;
    
    // Prevent the device screen from turning off and interrupting downloads
    await requestWakeLock();

    await sendNotification("Download Started", `Started downloading: ${title}`);

    toast.loading(`Downloading: ${title}...`, { id: toastId });

    let storage: any = null;
    let startTime = Date.now();
    let lastProgressTime = Date.now();
    let lastProgressValue = 0;

    try {
      storage = new shaka.offline.Storage();

      // Check if already downloaded
      const list = await storage.list();
      const alreadyDownloaded = list.find((item: any) => item.originalManifestUri === next.src || item.offlineUri === next.src);
      
      if (alreadyDownloaded) {
        toast.info(`Already downloaded: ${title}`, { id: toastId });
        setActiveDownload(null);
        processingRef.current = false;
        return; // Skip download entirely
      }

      storage.configure({
        drm: next.drmConfig?.clearKeys ? {
          servers: { "org.w3.clearkey": "" },
          clearKeys: next.drmConfig.clearKeys
        } : undefined,
        offline: {
          numberOfParallelDownloads: 20,
          progressCallback: (content: any, progress: number) => {
            const p = Math.round(progress * 100);
            const now = Date.now();
            
            // Throttle updates to max twice per second or when hitting 100%
            if (now - lastProgressTime > 500 || p >= 100) {
              const timeSinceStart = now - startTime;
              let eta = "Calculating...";
              let speed = "0 MB/s";

              if (p > 0 && p < 100 && timeSinceStart > 1000) {
                const estimatedTotalTime = timeSinceStart / progress;
                const timeLeftMs = estimatedTotalTime - timeSinceStart;
                const secondsLeft = Math.round(timeLeftMs / 1000);
                
                if (secondsLeft < 60) eta = `${secondsLeft}s remaining`;
                else eta = `${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s remaining`;
                
                // Extremely basic speed approx
                const percentDiff = p - lastProgressValue;
                const timeDiff = now - lastProgressTime;
                if (timeDiff > 0 && percentDiff > 0) {
                   // We don't have exact bytes, so we just show a generic active indicator
                   speed = "Downloading..."; 
                }
              }

              lastProgressTime = now;
              lastProgressValue = p;

              setProgress(p, eta, speed);

              if (p >= 100) {
                 setProgress(100, "Finalizing...", "");
              }
            }
          },
          trackSelectionCallback: (tracks: any[]) => {
            if (!tracks || tracks.length === 0) {
              console.error("No tracks found in manifest!");
              throw new Error("No video tracks available to download");
            }

            let selectedVariant;
            if (next.height) {
              // Fuzzy match height (e.g. 722px matches 720p)
              selectedVariant = tracks.find((t: any) => t.type === "variant" && t.height && Math.abs(t.height - next.height!) <= 20);
            }
            if (!selectedVariant && typeof next.qualityId === "number") {
              selectedVariant = tracks.find((t: any) => t.id === next.qualityId);
            }
            const textTracks = tracks.filter((t: any) => t.type === "text");
            
            if (selectedVariant) {
              return [selectedVariant, ...textTracks];
            }
            
            const variants = tracks.filter((t: any) => t.type === "variant");
            if (variants.length > 0) {
              variants.sort((a: any, b: any) => (b.bandwidth || 0) - (a.bandwidth || 0));
              return [variants[0], ...textTracks];
            }
            
            return tracks; 
          }
        }
      });

      if (next.signedUrlQuery) {
        storage.getNetworkingEngine()?.registerRequestFilter((type: number, request: shaka.extern.Request) => {
          if (type === shaka.net.NetworkingEngine.RequestType.LICENSE) return;
          if (request.uris) {
            request.uris = request.uris.map((uri: string) =>
              uri.includes(next.signedUrlQuery)
                ? uri
                : uri.includes("?")
                  ? `${uri}&${next.signedUrlQuery.slice(1)}`
                  : `${uri}${next.signedUrlQuery}`
            );
          }
        });
      }

      await storage.store(next.src, next.appMetadata);
      
      toast.success(`Download complete: ${title}`, { id: toastId });
      
      await sendNotification("Download Complete", `Successfully saved: ${title}`);

      loadCompletedDownloads(); // Refresh list
    } catch (err: any) {
      console.error("Download failed:", err);
      toast.error(`Download failed: ${err.message || "Unknown error"}`, { id: toastId });
      await sendNotification("Download Failed", `Failed to download: ${title}`);
    } finally {
      setActiveDownload(null);
      setProgress(null);
      processingRef.current = false;

      // Release the Screen Wake Lock when queue is empty to save battery
      const currentQueue = useDownloadStore.getState().queue;
      if (currentQueue.length === 0) {
        releaseWakeLock();
      }
      // DO NOT destroy storage here, it might abort saving. Let it GC.
    }
  };

  return null; // This component doesn't render anything globally, it just manages logic
}
