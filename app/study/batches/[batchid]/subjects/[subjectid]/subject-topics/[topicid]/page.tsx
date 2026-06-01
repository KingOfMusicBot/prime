"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { TopicInfo, GetPdf } from "@/utils/api";
import { toast } from "sonner";
import { LectureRow } from "@/app/components/LectureRow";
import { CollapsibleDocSection } from "@/app/components/CollapsibleDocSection";
import { fetchVideoDetails } from "@/lib/utils/videoFetcher";

// ─── Types ────────────────────────────────────────────
interface LectureItem {
  _id: string;
  topic?: string;
  date: string;
  urlType?: string;
  isLocked?: boolean;
  videoDetails?: {
    name?: string;
    image?: string;
    duration?: string;
    videoUrl?: string;
    embedCode?: string;
  };
}

// ─── Matching: positional index ──────────────────────
// DPP and Notes are assigned to lectures by position:
// allNotes[0] → lecture[0], allDpp[0] → lecture[0], etc.

// ─── Main page ─────────────────────────────────────────
export default function BatchContentPage() {
  const params = useParams();
  const router = useRouter();

  const batchId = params?.batchid as string;
  const subjectId = params?.subjectid as string;
  const topicId = params?.topicid as string;

  // Lectures
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Resources — all items + number-keyed maps
  const [allNotes, setAllNotes] = useState<any[]>([]);
  const [allDpp, setAllDpp] = useState<any[]>([]);
  // Resources are matched to lectures by index (no maps needed)
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

  // Notes/DPP accordion pagination
  const [notesPage, setNotesPage] = useState(1);
  const [dppPage, setDppPage] = useState(1);
  const [notesHasMore, setNotesHasMore] = useState(true);
  const [dppHasMore, setDppHasMore] = useState(true);
  const [notesLoadingMore, setNotesLoadingMore] = useState(false);
  const [dppLoadingMore, setDppLoadingMore] = useState(false);

  // ─── Helpers ──────────────────────────────────────────
  function getDisplayName(slug: string): string {
    if (!slug) return "Unknown";
    try {
      const decoded = decodeURIComponent(slug);
      const cleaned = decoded
        .replace(/-+\d+$/, "")
        .replace(/-+/g, " ")
        .trim();
      return cleaned
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
    } catch {
      return "Unknown";
    }
  }

  // ─── PDF open handler ─────────────────────────────────
  const handleOpenPdf = useCallback(
    async (pdfItem: any) => {
      if (!pdfItem) return;
      try {
        const attachment = pdfItem.homeworkIds?.[0]?.attachmentIds?.[0];
        if (attachment?.key && attachment?.baseUrl) {
          const fullUrl = attachment.baseUrl + attachment.key;
          try {
            const headRes = await fetch(fullUrl, { method: "HEAD" });
            if (headRes.ok) { window.open(fullUrl, "_blank"); return; }
          } catch (err) { console.warn("HEAD check failed:", err); }
        }

        await toast.promise(
          (async () => {
            const result = await GetPdf(batchId, subjectId, pdfItem._id);
            const key = result?.data?.key;
            const baseUrl = result?.data?.baseUrl;
            if (key && baseUrl) {
              const fullUrl = baseUrl + key;
              const headRes = await fetch(fullUrl, { method: "HEAD" });
              if (headRes.ok) { window.open(fullUrl, "_blank"); }
              else { throw new Error("PDF exists but couldn't be opened."); }
            } else { throw new Error("PDF not available."); }
          })(),
          { loading: "Fetching PDF…", success: "PDF opened!", error: (err) => err?.message || "Error opening PDF." }
        );
      } catch (error: any) {
        console.error("handleOpenPdf error:", error);
        toast.error(error.message || "Something went wrong opening the PDF.");
      }
    },
    [batchId, subjectId]
  );



  // ─── Reset on route change ────────────────────────────
  useEffect(() => {
    setPage(1);
    setLectures([]);
    setAllNotes([]);
    setAllDpp([]);
    setHasMore(true);
    setResourcesLoaded(false);
    setNotesPage(1);
    setDppPage(1);
    setNotesHasMore(true);
    setDppHasMore(true);
  }, [batchId, subjectId, topicId]);

  // ─── Fetch lectures ───────────────────────────────────
  useEffect(() => {
    if (!batchId || !subjectId || !topicId) return;
    const fetchLectures = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const response = await TopicInfo(batchId, subjectId, topicId, "videos", page);
        const items = response.data || [];
        setLectures((prev) => (page === 1 ? items : [...prev, ...items]));
        setHasMore(items.length > 0);
      } catch (err: any) {
        console.error("Error fetching lectures:", err);
        if (err.response?.status === 401) toast.error("Unauthorized: Please login again.");
        else toast.error("Failed to load lectures");
        if (page === 1) setLectures([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchLectures();
  }, [batchId, subjectId, topicId, page]);

  // ─── Fetch notes + DPP in parallel ────────────────────
  useEffect(() => {
    if (!batchId || !subjectId || !topicId) return;
    const fetchResources = async () => {
      try {
        const [notesRes, dppRes] = await Promise.all([
          TopicInfo(batchId, subjectId, topicId, "notes", 1).catch(() => ({ data: [] })),
          TopicInfo(batchId, subjectId, topicId, "DppNotes", 1).catch(() => ({ data: [] })),
        ]);

        const notes = notesRes.data || [];
        const dpps = dppRes.data || [];

        setAllNotes(notes);
        setAllDpp(dpps);
        setNotesHasMore(notes.length > 0);
        setDppHasMore(dpps.length > 0);
      } catch (err) {
        console.warn("Error fetching resources:", err);
      } finally {
        setResourcesLoaded(true);
      }
    };
    fetchResources();
  }, [batchId, subjectId, topicId]);

  // ─── Load more notes / DPP for accordion ──────────────
  const loadMoreNotes = useCallback(async () => {
    if (notesLoadingMore || !notesHasMore) return;
    const nextPage = notesPage + 1;
    setNotesLoadingMore(true);
    try {
      const res = await TopicInfo(batchId, subjectId, topicId, "notes", nextPage);
      const items = res.data || [];
      setAllNotes((prev) => [...prev, ...items]);
      setNotesHasMore(items.length > 0);
      setNotesPage(nextPage);
    } catch { setNotesHasMore(false); }
    finally { setNotesLoadingMore(false); }
  }, [batchId, subjectId, topicId, notesPage, notesLoadingMore, notesHasMore]);

  const loadMoreDpp = useCallback(async () => {
    if (dppLoadingMore || !dppHasMore) return;
    const nextPage = dppPage + 1;
    setDppLoadingMore(true);
    try {
      const res = await TopicInfo(batchId, subjectId, topicId, "DppNotes", nextPage);
      const items = res.data || [];
      setAllDpp((prev) => [...prev, ...items]);
      setDppHasMore(items.length > 0);
      setDppPage(nextPage);
    } catch { setDppHasMore(false); }
    finally { setDppLoadingMore(false); }
  }, [batchId, subjectId, topicId, dppPage, dppLoadingMore, dppHasMore]);

  // ─── Derived: match resources to lectures by index ────
  // DPP[0] → Lecture[0], Notes[0] → Lecture[0], etc.
  const getLectureResources = (lectureIndex: number) => {
    return {
      notes: lectureIndex < allNotes.length ? allNotes[lectureIndex] : null,
      dpp: lectureIndex < allDpp.length ? allDpp[lectureIndex] : null,
    };
  };

  // ─── Format doc items for accordion ───────────────────
  const formatDocItems = (items: any[]) =>
    items.map((item) => ({
      _id: item._id,
      title:
        item.homeworkIds?.[0]?.name ||
        item.homeworkIds?.[0]?.topic ||
        item.topic ||
        "Untitled",
      date: new Date(item.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      onView: () => handleOpenPdf(item),
    }));

  const subjectTitle = getDisplayName(subjectId);

  return (
    <div className="min-h-screen bg-[var(--spring-gradient-bg)] transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ─── Page Header ─────────────────────────── */}
        <div className="mb-8">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-[#22c55e] dark:text-[#6dd477] mb-1">
            {subjectTitle}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 transition-colors">
            {topicId === "all" ? "All Lectures" : getDisplayName(topicId)}
          </h1>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1.5 transition-colors">
            Lectures, notes &amp; practice problems in one place
          </p>
        </div>

        {/* ─── Lecture List ─────────────────────────── */}
        <div className="space-y-3 mb-10">
          {/* Skeletons */}
          {page === 1 && loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <LectureRow key={`skel-${i}`} lectureId="" isPlaceholder />
              ))
            : lectures.length === 0 && !loading
            ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-16">
                <Image
                  src="/assets/img/coming-soon.png"
                  width={280}
                  height={180}
                  className="object-contain opacity-50 mb-4"
                  alt="No content"
                />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No lectures available yet</p>
              </div>
            )
            : lectures.map((lecture, idx) => {
                const res = getLectureResources(idx);
                return (
                  <LectureRow
                    key={lecture._id}
                    lectureId={lecture._id}
                    thumbnail={
                      lecture.videoDetails?.image ||
                      "/assets/img/video-placeholder.svg"
                    }
                    title={
                      lecture.topic ||
                      lecture.videoDetails?.name ||
                      "Lecture"
                    }
                    duration={lecture.videoDetails?.duration || "00:00:00"}
                    date={new Date(lecture.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    alt={lecture.videoDetails?.name || "Lecture Thumbnail"}
                    onClick={() => {
                      router.push(
                        `/watch?batchId=${batchId}&SubjectId=${subjectId}&ChildId=${lecture._id}&Type=${lecture.urlType}&VideoUrl=${
                          lecture.videoDetails?.videoUrl ??
                          lecture.videoDetails?.embedCode
                        }&isLocked=${lecture.isLocked}`
                      );
                    }}
                    dppAvailable={!!res.dpp}
                    notesAvailable={!!res.notes}
                    onDppClick={() => handleOpenPdf(res.dpp)}
                    onNotesClick={() => handleOpenPdf(res.notes)}
                  />
                );
              })}
        </div>

        {/* ─── Load More Lectures ──────────────────── */}
        {hasMore && lectures.length > 0 && (
          <div className="flex justify-center mb-12">
            <button
              onClick={() => { if (!loadingMore) setPage((p) => p + 1); }}
              disabled={loadingMore}
              className="px-8 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-300 disabled:opacity-40 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-spring-leaf dark:hover:border-spring-mint/40 hover:text-spring-leaf dark:hover:text-spring-mint hover:bg-spring-leaf/5 dark:hover:bg-spring-mint/5"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-400 dark:border-gray-700 border-t-gray-700 dark:border-t-gray-300 rounded-full animate-spin" />
                  Loading…
                </span>
              ) : (
                "Load More Lectures"
              )}
            </button>
          </div>
        )}

        {/* ─── Collapsible Accordion Sections ─────── */}
        <div className="space-y-3">
          <CollapsibleDocSection
            icon="📄"
            title="All Notes"
            items={formatDocItems(allNotes)}
            loading={!resourcesLoaded}
            hasMore={notesHasMore}
            onLoadMore={loadMoreNotes}
            loadingMore={notesLoadingMore}
          />
          <CollapsibleDocSection
            icon="📑"
            title="All DPP PDFs"
            items={formatDocItems(allDpp)}
            loading={!resourcesLoaded}
            hasMore={dppHasMore}
            onLoadMore={loadMoreDpp}
            loadingMore={dppLoadingMore}
          />
        </div>

        {/* Bottom spacer */}
        <div className="h-12" />
      </div>


    </div>
  );
}
