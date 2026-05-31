"use client";

import React, { useEffect, useState } from "react";
import * as shaka from "shaka-player";
import { Trash2, PlayCircle, HardDriveDownload, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useDownloadStore } from "@/lib/store/useDownloadStore";

export default function DownloadsPage() {
  const { completedDownloads, activeDownload, progress, eta, speed, removeCompletedDownload } = useDownloadStore();
  const [loading, setLoading] = useState(true);
  const [allDownloads, setAllDownloads] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const rawLocal = localStorage.getItem("localDownloads") || "[]";
      const localList = JSON.parse(rawLocal);
      
      // Combine Shaka offline downloads and local device downloads
      setAllDownloads([...completedDownloads, ...localList]);
    } else {
      setAllDownloads(completedDownloads);
    }
    setLoading(false);
  }, [completedDownloads]);

  const handleDelete = async (e: React.MouseEvent, offlineUri: string) => {
    e.stopPropagation();
    
    if (offlineUri.startsWith("local-device-")) {
      const rawLocal = localStorage.getItem("localDownloads") || "[]";
      const localList = JSON.parse(rawLocal);
      const filtered = localList.filter((item: any) => item.offlineUri !== offlineUri);
      localStorage.setItem("localDownloads", JSON.stringify(filtered));
      setAllDownloads(allDownloads.filter(d => d.offlineUri !== offlineUri));
      
      try {
        const { deleteBlobFromIndexedDB } = await import('@/lib/utils/indexedDBStore');
        await deleteBlobFromIndexedDB(offlineUri);
      } catch (dbErr) {
        console.error("Failed to delete local video from database:", dbErr);
      }
      
      toast.success("Download removed successfully.");
      return;
    }

    // Prevent UI from hanging
    toast.loading("Deleting video...", { id: `delete-${offlineUri}` });
    
    let storage: any = null;
    try {
      storage = new shaka.offline.Storage();
      await storage.remove(offlineUri);
      await storage.destroy(); // Must destroy before other operations
      
      removeCompletedDownload(offlineUri);
      toast.success("Video deleted successfully.", { id: `delete-${offlineUri}` });
    } catch (err) {
      console.error("Failed to delete video:", err);
      toast.error("Failed to delete video.", { id: `delete-${offlineUri}` });
      if (storage) await storage.destroy();
    }
  };

  const handlePlay = (item: any) => {
    const lectureData = item.appMetadata?.lectureData || {};
    const params = new URLSearchParams();
    params.set("offlineUri", item.offlineUri);
    if (lectureData.batchId) params.set("batchId", lectureData.batchId);
    if (lectureData.subjectId) params.set("SubjectId", lectureData.subjectId);
    if (lectureData.id) params.set("ContentId", lectureData.id);
    
    router.push(`/watch?${params.toString()}`);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#eef7f0] via-[#e4f6e8] to-[#f5f8ff] dark:from-[#0F1908] dark:via-[#1C2B22] dark:to-[#151D1A] overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Active Download Banner */}
        {activeDownload && progress !== null && (
          <div className="mb-8 p-6 rounded-2xl bg-[#1c2b22] border border-spring-leaf/30 shadow-2xl relative overflow-hidden animate-fadeIn">
             <div 
               className="absolute top-0 left-0 h-full bg-spring-leaf/10 transition-all duration-300 ease-out" 
               style={{ width: `${progress}%` }}
             />
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-spring-leaf/20 flex items-center justify-center">
                    <div className="animate-spin w-6 h-6 border-2 border-spring-leaf border-t-transparent rounded-full" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-lg">
                      {progress >= 100 ? "Finalizing..." : `Downloading "${activeDownload.appMetadata?.lectureData?.topic || 'Video'}"`}
                    </h2>
                    <p className="text-spring-mint/80 text-sm flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Do not close the tab! You can navigate other pages.
                    </p>
                    {eta && speed && progress < 100 && (
                      <p className="text-spring-mint/60 text-xs mt-1">
                        {eta}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-spring-mint">
                    {progress >= 100 ? "Saving..." : `${progress}%`}
                  </span>
                </div>
             </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-spring-leaf/10 dark:bg-spring-mint/10 flex items-center justify-center">
            <HardDriveDownload className="w-6 h-6 text-spring-leaf dark:text-spring-mint" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-spring-forest dark:text-[#E8F5E9]">
              My Downloads
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Watch your saved lectures offline.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-spring-leaf/30 border-t-spring-leaf rounded-full animate-spin"></div>
          </div>
        ) : allDownloads.length === 0 ? (
          <div className="bg-white/80 dark:bg-[#1c2b22]/80 backdrop-blur-md rounded-2xl p-12 text-center shadow-spring-sm border border-spring-leaf/10 dark:border-spring-mint/15">
            <HardDriveDownload className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-spring-forest dark:text-[#E8F5E9] mb-2">
              No Downloads Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Videos you download for offline viewing will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allDownloads.map((item: any, index: number) => {
              const meta = item.appMetadata?.lectureData || {};
              const title = meta.title || meta.topic || "Unknown Lecture";
              const thumbnail = meta.thumbnail || "/assets/img/video-placeholder.svg";
              
              // Handle format specific labeling
              let sizeMB = "0.0";
              if (item.size) {
                sizeMB = (item.size / (1024 * 1024)).toFixed(1);
              }
              const isLocal = item.appMetadata?.isLocalFile;
              const formatStr = item.appMetadata?.fileFormat ? `[Local ${item.appMetadata.fileFormat.toUpperCase()}]` : "";

              return (
                <div
                  key={item.offlineUri || index}
                  onClick={() => handlePlay(item)}
                  className={`group relative bg-white dark:bg-[#1B2124] rounded-2xl overflow-hidden shadow-spring-sm border border-spring-leaf/10 dark:border-spring-mint/10 hover:shadow-spring-md transition-all duration-300 cursor-pointer hover:-translate-y-1`}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={thumbnail}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-white" />
                    </div>
                    {isLocal && (
                      <div className="absolute top-2 left-2 px-2.5 py-1 bg-spring-leaf text-white font-bold rounded-lg text-[10px] uppercase shadow-sm">
                        {item.appMetadata.fileFormat}
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded-md text-xs font-medium text-white backdrop-blur-sm">
                      {sizeMB !== "0.0" ? `${sizeMB} MB` : "Local File"}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                      {formatStr} {title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                      Downloaded: {item.appMetadata?.downloadedAt ? new Date(item.appMetadata.downloadedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                    
                    <button
                      onClick={(e) => handleDelete(e, item.offlineUri)}
                      className="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
