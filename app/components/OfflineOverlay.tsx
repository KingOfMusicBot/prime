"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { HardDriveDownload, WifiOff } from "lucide-react";

export default function OfflineOverlay() {
  const [isOffline, setIsOffline] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check initial state
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Only show on study pages (excluding downloads and watch with offlineUri)
  if (!isOffline) return null;
  if (pathname === "/study/downloads") return null;
  if (!pathname?.startsWith("/study") && !pathname?.startsWith("/watch")) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0F1908]/95 backdrop-blur-md text-white flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
      <div className="bg-spring-leaf/10 p-6 rounded-full mb-6">
        <WifiOff className="w-16 h-16 text-spring-mint animate-pulse" />
      </div>
      <h1 className="text-4xl font-bold mb-4 text-[#E8F5E9]">You are Offline</h1>
      <p className="text-xl text-spring-mint/80 mb-12 max-w-md">
        It looks like you've lost your internet connection. But don't worry, you can still watch all the videos you've saved!
      </p>
      
      <Link 
        href="/study/downloads"
        className="flex items-center gap-3 px-8 py-4 bg-spring-leaf text-white rounded-2xl hover:bg-spring-forest transition-colors shadow-lg hover:shadow-spring-md font-semibold text-lg hover:-translate-y-1 duration-300"
      >
        <HardDriveDownload className="w-6 h-6" />
        Go to My Downloads
      </Link>
    </div>
  );
}
