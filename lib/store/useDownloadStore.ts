import { create } from "zustand";

export interface PendingDownload {
  src: string;
  qualityId: number;
  height?: number;
  drmConfig: any;
  signedUrlQuery: string;
  appMetadata: any;
}

interface DownloadState {
  // Queue of downloads waiting to be processed
  queue: PendingDownload[];
  
  // Currently active download
  activeDownload: PendingDownload | null;
  progress: number | null;
  eta: string | null;
  speed: string | null;
  
  // Completed downloads (cache of shaka storage list)
  completedDownloads: any[];
  
  // Actions
  addDownload: (download: PendingDownload) => void;
  setActiveDownload: (download: PendingDownload | null) => void;
  setProgress: (progress: number | null, eta?: string | null, speed?: string | null) => void;
  setCompletedDownloads: (downloads: any[]) => void;
  removeCompletedDownload: (offlineUri: string) => void;
  popQueue: () => PendingDownload | undefined;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  queue: [],
  activeDownload: null,
  progress: null,
  eta: null,
  speed: null,
  completedDownloads: [],

  addDownload: (download) => {
    set((state) => ({ queue: [...state.queue, download] }));
  },

  setActiveDownload: (download) => {
    set({ activeDownload: download });
  },

  setProgress: (progress, eta = null, speed = null) => {
    set({ progress, eta, speed });
  },

  setCompletedDownloads: (downloads) => {
    set({ completedDownloads: downloads });
  },

  removeCompletedDownload: (offlineUri) => {
    set((state) => ({
      completedDownloads: state.completedDownloads.filter(d => d.offlineUri !== offlineUri)
    }));
  },

  popQueue: () => {
    const { queue } = get();
    if (queue.length === 0) return undefined;
    const next = queue[0];
    set({ queue: queue.slice(1) });
    return next;
  }
}));
