// Updated LectureRow component with Spring theme styling and light/dark mode support
"use client";

import { Play, Clock5, Check } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { ResourceBadge } from "./ResourceBadge";

interface LectureRowProps {
  lectureId: string;
  thumbnail?: string;
  title?: string;
  instructor?: string;
  duration?: string;
  date?: string;
  alt?: string;
  isPlaceholder?: boolean;
  onClick?: () => void;
  // Resource availability
  dppAvailable?: boolean;
  notesAvailable?: boolean;
  onDppClick?: () => void;
  onNotesClick?: () => void;
}

export const LectureRow = ({
  lectureId,
  thumbnail,
  title,
  instructor,
  duration,
  date,
  alt,
  isPlaceholder = false,
  onClick,
  dppAvailable = false,
  notesAvailable = false,
  onDppClick,
  onNotesClick,
}: LectureRowProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (lectureId) {
      try {
        const list = JSON.parse(localStorage.getItem("completedLectures") || "[]") || [];
        setIsCompleted(list.includes(lectureId));
      } catch {
        setIsCompleted(false);
      }
    }
  }, [lectureId]);

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lectureId) return;
    try {
      const list = JSON.parse(localStorage.getItem("completedLectures") || "[]") || [];
      if (list.includes(lectureId)) {
        localStorage.setItem(
          "completedLectures",
          JSON.stringify(list.filter((id: string) => id !== lectureId))
        );
        setIsCompleted(false);
      } else {
        list.push(lectureId);
        localStorage.setItem("completedLectures", JSON.stringify(list));
        setIsCompleted(true);
      }
    } catch {
      /* ignore */
    }
  };

  /* ── Skeleton ───────────────────────────────── */
  if (isPlaceholder) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl animate-pulse spring-glass-card">
        {/* Thumbnail skeleton */}
        <div className="w-full sm:w-[160px] h-[90px] rounded-lg shrink-0 bg-gray-700 dark:bg-gray-800" />
        {/* Content skeleton */}
        <div className="flex-1 flex flex-col justify-between py-0.5">
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-700 dark:bg-gray-800" />
            <div className="h-3 w-1/2 rounded bg-gray-700 dark:bg-gray-800" />
          </div>
          <div className="flex gap-3 mt-3">
            <div className="h-6 w-20 rounded-full bg-gray-700 dark:bg-gray-800" />
            <div className="h-6 w-16 rounded-full bg-gray-700 dark:bg-gray-800" />
            <div className="ml-auto h-7 w-28 rounded-lg bg-gray-700 dark:bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Actual Card ────────────────────────────── */
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col sm:flex-row gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 ease-out border-l-4 border-transparent hover:border-l-[var(--spring-leaf)] spring-glass-card"
    >
      {/* ── Thumbnail ─────────────────────────── */}
      <div className="relative w-full sm:w-[160px] h-[90px] rounded-lg overflow-hidden shrink-0 self-start">
        <Image
          alt={alt ?? "Lecture thumbnail"}
          src={thumbnail ?? "/assets/img/video-placeholder.svg"}
          className="w-full h-full object-cover"
          width={160}
          height={90}
        />
        {/* Play overlay — visible on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110"
            style={{ background: "var(--spring-leaf)" }}
          >
            <Play size={16} className="text-white ml-0.5" fill="#ffffff" strokeWidth={0} />
          </span>
        </div>
        {/* Duration badge on thumbnail */}
        {duration && (
          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium text-white/90 bg-black/70 backdrop-blur-sm">
            {duration}
          </span>
        )}
      </div>

      {/* ── Content ───────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        {/* Top: title + meta */}
        <div>
          <h3 className="text-[15px] font-semibold text-primary leading-snug line-clamp-2 mb-1 group-hover:text-[var(--spring-leaf)] dark:group-hover:text-white transition-colors duration-200">
            {title || "Lecture"}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-gray-500 dark:text-gray-400">
            {instructor && (
              <>
                <span>By {instructor}</span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
              </>
            )}
            {date && <time className="font-medium text-gray-700 dark:text-gray-300">{date}</time>}
            {duration && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="flex items-center gap-1">
                  <Clock5 size={11} />
                  {duration}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bottom: resource badges + mark complete */}
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          <ResourceBadge type="dpp" available={dppAvailable} onClick={onDppClick} />
          <ResourceBadge type="notes" available={notesAvailable} onClick={onNotesClick} />
          <div className="flex-1" />
          
          {isMounted && (
            <button
              onClick={handleMarkComplete}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 border active:scale-95 ${isCompleted
                  ? "bg-[var(--spring-leaf)] border-[var(--spring-leaf)] text-white shadow-[0_0_12px_rgba(76,175,106,0.3)]"
                  : "bg-transparent border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400 hover:border-[var(--spring-leaf)] hover:text-[var(--spring-leaf)] dark:hover:border-[var(--spring-mint)] dark:hover:text-[var(--spring-mint)]"
                }`}
              title={isCompleted ? "Mark as incomplete" : "Mark as completed"}
            >
              <Check size={13} strokeWidth={isCompleted ? 3 : 2} />
              {isCompleted ? "Completed" : "Mark Complete"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
