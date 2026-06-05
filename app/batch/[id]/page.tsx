"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { BatchInfo, getTodaysSchedule, getUserDetailsList, enrollBatch, UnenrollBatch } from "@/utils/api";
import LiveClassCard from "@/app/components/LiveClassCard";
import { Button } from "@/components/ui/button";
import { BellDot, MessagesSquare, BookmarkPlus } from "lucide-react";
import he from "he";
import BatchCard from "@/app/components/BatchCard";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.id as string; // Uses 'id' param instead of 'batchid'
  const [hasMore, setHasMore] = useState(true);
  const pathname = usePathname();
  const [pageView, setPageView] = useState<"batch" | "announcement">("batch");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(
    null
  );
  const [announcementPage, setAnnouncementPage] = useState<number>(1);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"description" | "classes">(
    "classes"
  );
  const [batchInternalId, setBatchInternalId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);

  useEffect(() => {
    if (!batchId) return;
    const updateEnrollStatus = () => {
      const enrolledBatchesStr = localStorage.getItem("enrolledBatches") || "[]";
      try {
        const enrolledBatches = JSON.parse(enrolledBatchesStr);
        if (Array.isArray(enrolledBatches)) {
          setIsEnrolled(enrolledBatches.some((b: any) => b.batchId === batchId));
        }
      } catch (e) {
        console.error(e);
      }
    };
    updateEnrollStatus();
    window.addEventListener("batchesUpdated", updateEnrollStatus);
    return () => {
      window.removeEventListener("batchesUpdated", updateEnrollStatus);
    };
  }, [batchId]);

  const handleEnrollClick = async () => {
    if (enrollLoading || !batchId || !batchDetails) return;
    setEnrollLoading(true);
    try {
      const batchName = batchDetails.name || batchDetails.batchName || "Batch";
      if (isEnrolled) {
        const res = await UnenrollBatch(batchId, batchName);
        if (res.success) {
          const enrolledBatchesStr = localStorage.getItem("enrolledBatches") || "[]";
          let enrolledBatches = [];
          try { enrolledBatches = JSON.parse(enrolledBatchesStr); } catch (e) {}
          enrolledBatches = enrolledBatches.filter((b: any) => b.batchId !== batchId);
          localStorage.setItem("enrolledBatches", JSON.stringify(enrolledBatches));
          setIsEnrolled(false);
          toast.success(`Unenrolled from "${batchName}".`);
          window.dispatchEvent(new Event("batchesUpdated"));
        } else {
          toast.error(res.message || "Failed to unenroll.");
        }
      } else {
        const res = await enrollBatch(batchId, batchName);
        if (res.success) {
          const enrolledBatchesStr = localStorage.getItem("enrolledBatches") || "[]";
          let enrolledBatches = [];
          try { enrolledBatches = JSON.parse(enrolledBatchesStr); } catch (e) {}
          if (!enrolledBatches.some((b: any) => b.batchId === batchId)) {
            enrolledBatches.push({ batchId, name: batchName });
            localStorage.setItem("enrolledBatches", JSON.stringify(enrolledBatches));
          }
          setIsEnrolled(true);
          toast.success(`Successfully enrolled in "${batchName}".`);
          window.dispatchEvent(new Event("batchesUpdated"));
        } else {
          toast.error(res.message || "Failed to enroll.");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setEnrollLoading(false);
    }
  };
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [teacherMap, setTeacherMap] = useState<
    Record<string, { name: string; imageUrl: string }>
  >({});

  const searchParams = useSearchParams();

  useEffect(() => {
    const toastMsg = searchParams?.get("toast");
    if (toastMsg) {
      toast.success(decodeURIComponent(toastMsg));
    }
  }, [searchParams, toast]);

  const fetchAnnouncements = async () => {
    if (pageView !== "announcement" || !batchInternalId) return;

    setAnnouncementLoading(true);
    setAnnouncementError(null);

    try {
      const res = await BatchInfo(
        batchInternalId,
        "announcement",
        announcementPage
      );
      const newAnnouncements = res.data || [];

      setAnnouncements((prev) =>
        announcementPage === 1
          ? newAnnouncements
          : [...prev, ...newAnnouncements]
      );

      if (newAnnouncements.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        toast.error("Unauthorized: Please login again.");
      } else {
        toast.error("Failed to load enrolled batches");
      }
      setAnnouncementError(
        err?.response?.data?.message || "Failed to fetch announcements"
      );
      setHasMore(false);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  useEffect(() => {
    if (pageView === "announcement") {
      setAnnouncementPage(1);
      setHasMore(true);
    }
  }, [pageView]);

  useEffect(() => {
    fetchAnnouncements();
  }, [pageView, batchId, batchInternalId, announcementPage]);

  const fetchTodaysSchedule = async (targetBatchId: string) => {
    try {
      const scheduleRes = await getTodaysSchedule(targetBatchId);
      const scheduleData = scheduleRes.data || [];
      const videoSchedule = scheduleData;

      const teacherIdSet = new Set<string>();
      videoSchedule.forEach((item: any) => {
        if (Array.isArray(item.teachers) && item.teachers.length > 0) {
          item.teachers.forEach((id: string) => teacherIdSet.add(id));
        }
      });
      const uniqueTeacherIds = Array.from(teacherIdSet);

      let teacherList: any[] = [];
      if (uniqueTeacherIds.length > 0) {
        const teacherRes = await getUserDetailsList(uniqueTeacherIds);
        teacherList = teacherRes.data || [];
      }

      const teacherMapTemp: Record<string, { name: string; imageUrl: string }> =
        {};

      teacherList.forEach((teacher: any) => {
        teacherMapTemp[teacher._id] = {
          name: teacher.name,
          imageUrl: teacher.imageId
            ? `${teacher.imageId.baseUrl}${teacher.imageId.key}`
            : "/assets/img/teacher-placeholder.png",
        };
      });

      videoSchedule.forEach((item: any) => {
        const hasTeachers =
          Array.isArray(item.teachers) && item.teachers.length > 0;

        if (!hasTeachers && item.videoDetails?.image) {
          const fallbackId = item._id;
          teacherMapTemp[fallbackId] = {
            name: "",
            imageUrl: item.videoDetails.image,
          };
        }
      });

      setSchedule(videoSchedule);
      setTeacherMap(teacherMapTemp);
    } catch (err: any) {
      console.error("Failed to fetch today's schedule:", err);
      setSchedule([]);
      setTeacherMap({});
    }
  };

  useEffect(() => {
    const fetchBatchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await BatchInfo(batchId, "details");
        const data = res.data;
        setBatchDetails(data);
        if (data?._id) {
          setBatchInternalId(data._id);
        }

        if (batchId) {
          fetchTodaysSchedule(batchId);
        }
      } catch (error: any) {
        setError(
          error?.response?.data?.message || "Error fetching batch details"
        );
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (batchId) fetchBatchDetails();
  }, [batchId]);

  if (pageView === "announcement") {
    return (
      <>
        {previewSrc && (
          <div
            className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center"
            onClick={() => setPreviewSrc(null)}
          >
            <div className="relative max-w-3xl w-full p-4 dark:border bg-foreground rounded divshadow">
              <img
                src={previewSrc}
                alt="Preview"
                className="rounded-lg max-h-[80vh] mx-auto"
              />
            </div>
          </div>
        )}
        <div className="p-5">
          <div className="container mx-auto px-0 py-6">
            <div className="divshadow bg-background border rounded-lg p-6">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <Button
                  onClick={() => setPageView("batch")}
                  className="sm:p-1 sm:h-min"
                >
                  ← Back to Batch
                </Button>
                <h3 className="text-xl font-bold">📢 Announcements</h3>
                <span />
              </div>
              <div>
                {announcementLoading && announcementPage === 1 ? (
                  <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3">
                    <BatchCard isPlaceholder />
                    <BatchCard isPlaceholder />
                    <BatchCard isPlaceholder />
                  </div>
                ) : announcements.length ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3">
                      {announcements.map((item, idx) => (
                        <div
                          key={idx}
                          className="no-scrollbar flex flex-col gap-4 overflow-y-scroll justify-between bg-background border p-4 divshadow max-h-96 rounded-lg"
                        >
                          <div className="flex items-start gap-4">
                            <img
                              className="h-11 w-11"
                              src="/assets/img/defaultSubject.svg"
                              alt="PW Logo"
                            />
                            <div>
                              <span className="mt-3 text-sm font-bold">
                                PW Team
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="text-sm space-y-2">
                            <p className="break-words whitespace-pre-wrap">
                              {item.announcement}
                            </p>
                          </div>

                          {item.attachment && (
                            <div
                              onClick={() => {
                                const url =
                                  item.attachment.baseUrl + item.attachment.key;
                                setPreviewSrc(url);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="relative aspect-video w-full">
                                <Image
                                  src={
                                    item.attachment.baseUrl +
                                    item.attachment.key
                                  }
                                  alt="Announcement visual"
                                  className="object-contain rounded"
                                  fill
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {hasMore && (
                      <div className="flex justify-center mt-4">
                        <Button
                          variant="outline"
                          onClick={() =>
                            setAnnouncementPage((prev) => prev + 1)
                          }
                          disabled={announcementLoading}
                        >
                          {announcementLoading ? "Loading..." : "Load More"}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 border rounded-md text-center">
                    <p className="p-4">No announcements available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (pageView === "batch") {
    return (
      <>
        <div className="p-5">
          <div className="bg-background border rounded-[20px_20px_0_0]">
            <div className="rounded-[20px_20px_0_0] overflow-hidden">
              <div className="bg-[url(/assets/img/descriptionHeader.svg)] bg-no-repeat bg-cover bg-center container mx-auto px-4 py-6">
                {batchDetails ? (
                  <h1 className="text-2xl font-bold text-white p-2">
                    {batchDetails.name}
                  </h1>
                ) : (
                  <div className="h-8 w-64 bg-muted-foreground/30 animate-pulse rounded p-2" />
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center w-auto justify-between px-0 divshadow">
              <div className="flex overflow-x-auto mx-3 gap-5">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`px-1 text-foreground py-3 text-xs w-auto font-medium transition-all border-b-4 ${activeTab === "description"
                    ? "border-spring-leaf text-spring-leaf dark:text-spring-mint dark:border-spring-mint rounded"
                    : "border-transparent hover:text-spring-leaf dark:hover:text-spring-mint text-foreground/75"
                    }`}
                >
                  📘 Description
                </button>

                <button
                  onClick={() => setActiveTab("classes")}
                  className={`px-1 text-foreground py-3 text-xs w-auto font-medium transition-all border-b-4 ${activeTab === "classes"
                    ? "border-spring-leaf text-spring-leaf dark:text-spring-mint dark:border-spring-mint rounded"
                    : "border-transparent hover:text-spring-leaf dark:hover:text-spring-mint text-foreground/75"
                    }`}
                >
                  🎁 All Classes
                </button>
              </div>

              <div className="flex items-center gap-2 text-foreground rounded-lg mx-5">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="gap-2 px-4 py-2.5 text-xs font-semibold border border-spring-leaf/25 dark:border-spring-mint/20 hover:border-spring-leaf text-spring-leaf dark:text-spring-mint hover:bg-spring-leaf/5 dark:hover:bg-spring-mint/5 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center h-min"
                >
                  <MessagesSquare className="w-4 h-4" />
                  Share Batch
                </button>
                <button
                  onClick={() => setPageView("announcement")}
                  className="gap-2 px-4 py-2.5 text-xs font-semibold border border-spring-leaf/25 dark:border-spring-mint/20 hover:border-spring-leaf text-spring-leaf dark:text-spring-mint hover:bg-spring-leaf/5 dark:hover:bg-spring-mint/5 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center h-min"
                >
                  <svg
                    width="24"
                    className="!w-6 !h-6 dark:!stroke-white stroke-black"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14.1426 15.8113C15.5636 15.6427 16.9337 15.3087 18.2333 14.8289C17.1557 13.6328 16.4999 12.0492 16.4999 10.3125V9.78689C16.5 9.7746 16.5 9.76231 16.5 9.75C16.5 7.26472 14.4853 5.25 12 5.25C9.51472 5.25 7.5 7.26472 7.5 9.75L7.49985 10.3125C7.49985 12.0492 6.84396 13.6328 5.76636 14.8289C7.06605 15.3087 8.43632 15.6428 9.85735 15.8113M14.1426 15.8113C13.44 15.8946 12.7249 15.9375 11.9999 15.9375C11.2749 15.9375 10.5599 15.8946 9.85735 15.8113M14.1426 15.8113C14.2124 16.0283 14.25 16.2598 14.25 16.5C14.25 17.7426 13.2426 18.75 12 18.75C10.7574 18.75 9.75 17.7426 9.75 16.5C9.75 16.2598 9.78764 16.0284 9.85735 15.8113"
                      stroke=""
                      strokeWidth="1.325"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="16.125"
                      cy="7.125"
                      r="3.1875"
                      fill="#BF2734"
                      stroke="white"
                      strokeWidth="1.125"
                    />
                  </svg>
                  Announcement
                </button>
              </div>
            </div>
          </div>

          {activeTab === "description" && (
            <div className="container mx-auto px-0 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="divshadow bg-background border rounded-lg p-6 !text-foreground">
                    <h2 className="text-xl font-semibold mb-4">
                      This Batch Includes
                    </h2>
                    {batchDetails?.shortDescription ? (
                      <div
                        className="text-foreground dark:text-white"
                        dangerouslySetInnerHTML={{
                          __html: he.decode(batchDetails.shortDescription),
                        }}
                      />
                    ) : (
                      <div className="space-y-3">
                        <div className="h-4 w-full bg-muted-foreground/30 animate-pulse rounded" />
                        <div className="h-4 w-5/6 bg-muted-foreground/30 animate-pulse rounded" />
                        <div className="h-4 w-4/6 bg-muted-foreground/30 animate-pulse rounded" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-20">
                    <div className="bg-background border rounded-lg overflow-hidden shadow-md">
                      <div className="relative">
                        {batchDetails ? (
                          <Image
                            src={
                              batchDetails.previewImage.baseUrl +
                              batchDetails.previewImage.key
                            }
                            alt={batchDetails.name}
                            width={400}
                            height={200}
                            className="w-full object-contain"
                            priority
                          />
                        ) : (
                          <div className="h-48 bg-muted-foreground/30 animate-pulse rounded" />
                        )}

                        <span className="absolute top-2 right-2 bg-yellow-400 text-xs px-2 py-1 rounded">
                          New
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          {batchDetails ? (
                            <>
                              <span className="text-sm text-muted-foreground">
                                {batchDetails.byName}
                              </span>
                              <span className="rounded-md bg-pink-50 dark:text-white dark:bg-muted px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-pink-700/10 ring-inset">
                                {batchDetails.language}
                              </span>
                            </>
                          ) : (
                            <div className="h-8 w-full bg-muted-foreground/30 animate-pulse rounded" />
                          )}
                        </div>
                        <div className="bg-green-50 dark:bg-muted rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">🎯</span>
                            <span className="text-sm font-medium">
                              Enroll Now, To Ease Access
                            </span>
                          </div>
                        </div>
                        <button
                          className={`w-full py-3 flex items-center justify-center gap-2 font-semibold hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-spring-sm hover:shadow-spring-md rounded-xl ${
                            isEnrolled
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "spring-btn-primary"
                          }`}
                          onClick={handleEnrollClick}
                          disabled={enrollLoading}
                        >
                          {enrollLoading
                            ? "PROCESSING..."
                            : isEnrolled
                            ? "UNENROLL BATCH"
                            : "ENROLL NOW"}
                          <BookmarkPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "classes" && (
            <div className="container mx-auto px-0 py-6">
              <div className="lg:col-span-2 space-y-6">
                {schedule.length > 0 && (
                  <div className="divshadow bg-background border rounded-lg p-6 mb-6 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                      </span>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                        Today's Live Class
                      </h3>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 whitespace-nowrap scroll-smooth select-none">
                      {schedule.map((cls: any, idx: number) => {
                        const teacherId = cls.teachers?.[0];
                        const teacher = teacherMap[teacherId] || teacherMap[cls._id];

                        const teacherName = teacher?.name || "";
                        const teacherImage = teacher?.imageUrl;

                        const startTime = new Date(cls.startTime);
                        const endTime = new Date(cls.endTime);
                        const now = new Date();

                        const isBefore = now < startTime;
                        const isDuring = now >= startTime && now <= endTime;
                        const isAfter = now > endTime;

                        const hoursLeft = Math.floor(
                          (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
                        );
                        const minutesLeft = Math.floor(
                          ((startTime.getTime() - now.getTime()) / (1000 * 60)) % 60
                        );

                        const handleClick = () => {
                          const { batchId: bId, subjectId: sId, _id: childId, urlType } = cls;

                          if (
                            urlType === "vimeo" ||
                            (urlType === "awsVideo" && isBefore)
                          ) {
                            if (startTime > now) {
                              toast.error(
                                `Upcoming live class in ${hoursLeft > 0 ? `${hoursLeft}h ` : ""
                                }${minutesLeft}m`
                              );
                            } else {
                              toast.error(
                                "This class has not started yet. Try refreshing..."
                              );
                            }
                          } else if (urlType === "penpencilvdo") {
                            router.push(
                              `/watch?batchId=${bId}&SubjectId=${sId?._id}&ChildId=${childId}&Type=penpencilvdo&isLocked=false`
                            );
                          } else if (urlType === "awsVideo") {
                            if (isDuring) {
                              router.push(
                                `/live?batchId=${bId}&SubjectId=${sId?._id}&ChildId=${childId}&Type=awsVideo`
                              );
                            } else if (isAfter) {
                              toast.error("Live session has ended.");
                            }
                          }
                        };

                        return (
                          <LiveClassCard
                            key={cls._id}
                            teacherName={teacherName}
                            teacherImage={teacherImage}
                            subject={cls.subjectId?.name || "Subject"}
                            startTime={startTime.toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            tag={cls.tag}
                            onClick={handleClick}
                            priority={idx === 0}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="divshadow bg-background border rounded-lg p-6">
                  <h3 className="text-2xl font-bold text-static-black max-md:text-xl max-sm:text-base mb-2">
                    Subjects
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {batchDetails?.subjects?.length ? (
                      batchDetails.subjects.map((subject: any) => {
                        const imageUrl = subject.imageId
                          ? subject.imageId.baseUrl + subject.imageId.key
                          : `/assets/img/defaultSubject.svg`;

                        return (
                          <div
                            key={subject._id}
                            className="flex items-center gap-4 bg-white/90 dark:bg-spring-forest-surface/70 border border-spring-leaf/10 dark:border-spring-mint/15 rounded-xl p-4 hover:shadow-spring-md hover:-translate-y-0.5 cursor-pointer divshadow transition-all duration-300"
                            onClick={() =>
                              router.push(
                                `/study/batches/${batchDetails.batchId ?? batchDetails._id ?? batchDetails.slug}/subjects/${subject.slug}`
                              )
                            }
                          >
                            <div className="text-[#2a4365] text-xl flex-shrink-0">
                              <Image
                                src={imageUrl}
                                alt={subject.subject}
                                width={40}
                                height={40}
                              />
                            </div>
                            <div>
                              <div className="max-w-full sm:max-w-[140px] overflow-hidden">
                                <p className="font-semibold text-foreground truncate text-sm sm:text-base md:text-lg">
                                  {subject.subject}
                                </p>
                              </div>

                              <p className="text-xs text-muted-foreground">
                                {subject.tagCount} Chapters
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <>
                        {[...Array(6)].map((_, index) => (
                          <div key={index} className="space-y-3">
                            <div className="h-4 w-full bg-muted-foreground/30 animate-pulse rounded" />
                            <div className="h-4 w-5/6 bg-muted-foreground/30 animate-pulse rounded" />
                            <div className="h-4 w-4/6 bg-muted-foreground/30 animate-pulse rounded" />
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {isShareModalOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setIsShareModalOpen(false)}
          >
            <div
              className="w-full max-w-sm bg-white/95 dark:bg-[#1c2b22]/95 backdrop-blur-md rounded-3xl border border-spring-leaf/15 dark:border-spring-mint/20 shadow-spring-xl p-6 text-center transform transition-all animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-spring-leaf/10 dark:bg-spring-mint/10 flex items-center justify-center animate-leaf-sway">
                  <MessagesSquare className="w-6 h-6 text-spring-leaf dark:text-spring-mint" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-spring-forest dark:text-[#E8F5E9] mb-2">
                Share Batch
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Share "{batchDetails?.name || "this batch"}" with your friends to study together! 🍃
              </p>

              <div className="space-y-3">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Hey! Study this PW batch: "${batchDetails?.name}" here for free:\n${typeof window !== "undefined" ? window.location.href : ""}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  <span>💬</span> Share on WhatsApp
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}&text=${encodeURIComponent(
                    `Study this PW batch: "${batchDetails?.name}" here for free `
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white font-semibold rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  <span>✈️</span> Share on Telegram
                </a>

                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Batch link copied to clipboard! 📋");
                      setIsShareModalOpen(false);
                    }
                  }}
                  className="w-full py-3 bg-spring-leaf/12 dark:bg-spring-mint/10 text-spring-leaf dark:text-spring-mint border border-spring-leaf/20 dark:border-spring-mint/20 hover:bg-spring-leaf/18 dark:hover:bg-spring-mint/15 font-semibold rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  <span>🔗</span> Copy Link
                </button>
              </div>

              <button
                onClick={() => setIsShareModalOpen(false)}
                className="mt-6 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
}
