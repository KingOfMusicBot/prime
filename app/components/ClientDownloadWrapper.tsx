"use client";

import dynamic from "next/dynamic";

const GlobalDownloadManager = dynamic(
  () => import("@/app/components/GlobalDownloadManager"),
  { ssr: false }
);

export default function ClientDownloadWrapper() {
  return <GlobalDownloadManager />;
}
