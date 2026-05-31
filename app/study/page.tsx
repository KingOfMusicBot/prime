"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import BatchCard from "@/app/components/BatchCard";
import PromotionPopup from "@/app/components/PromotionPopup";

interface Button {
  Name: string;
  Link: string;
}

interface Promotion {
  title: string;
  message?: string;
  imageUrl?: string;
  button?: Button;
}


import {
  getEnrolledBatches,
  getTodaysSchedule,
  getUserDetailsList,
} from "@/utils/api";
import { toast } from "sonner";
import LiveClassCard from "@/app/components/LiveClassCard";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight } from "lucide-react";

type EnrolledBatch = { _id: string; batchId: string; name: string };

export default function Home() {
  const router = useRouter();
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableClasses, setAvailableClasses] = useState<EnrolledBatch[]>([]);
  const [schedule, setSchedule] = useState([]);
  const [teacherMap, setTeacherMap] = useState<
    Record<string, { name: string; imageUrl: string }>
  >({});

  const [batchInfo, setBatchInfo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [watchHistory, setWatchHistory] = useState<any[]>([]);

  // Fetch watch history from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("watchHistory") || "[]";
        setWatchHistory(JSON.parse(raw));
      } catch (err) {
        console.error("Failed to load watch history:", err);
      }
    }
  }, []);

  // const [promotion, setPromotion] = useState<Promotion | null>(null);

  // useEffect(() => {
  //   const fetchPromo = async () => {
  //     const res = await fetch("/api/promotion");
  //     const data = await res.json();
  //     setPromotion(data.promo);
  //   };
  //   fetchPromo();
  // }, []);
  const TgChannel = serverInfo?.tg_channel || process.env.NEXT_PUBLIC_TG;


  const promotion = {
    title: "Telegram Community !!",
    message: `Join The Channel For Latest Updates 👍 Don't miss any Future updates!`,
    imageUrl: "https://hwxiuozbwicvsxnetkvi.supabase.co/storage/v1/object/public/avatars/d60abe26-fd16-4d73-bb94-31202a5c66ee/avatar.png?t=1779902177459",
    button: { Name: "Join Now!", Link: TgChannel },
  };


  useEffect(() => {
    async function fetchServerInfo() {
      try {
        const res = await fetch("/api/auth/serverInfo");
        if (!res.ok) throw new Error("Failed to fetch server info");
        const data = await res.json();
        setServerInfo(data);
      } catch (err) {
        setError("Could not load server info");
      } finally {
        setLoading(false);
      }
    }
    fetchServerInfo();
  }, []);

  const OpenTelegramChannel = () => {
    window.open(TgChannel, "_blank");
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onMouseLeave = () => {
    setIsDragging(false);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 1; // scroll speed factor
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };
  const [selectedClass, setSelectedClass] = useState<EnrolledBatch>({
    _id: "",
    batchId: "",
    name: "Select Batch",
  });

  const fetchTodaysSchedule = async (batchId: string) => {
    try {
      // Step 1: Fetch today's schedule for batch
      const scheduleRes = await getTodaysSchedule(batchId);
      const scheduleData = scheduleRes.data || [];

      // Show all scheduled classes (not just video lectures)
      console.log("📅 Today's schedule raw data:", scheduleData);
      const videoSchedule = scheduleData;

      // Step 2: Extract all unique teacher IDs
      const teacherIdSet = new Set<string>();
      videoSchedule.forEach((item: any) => {
        if (Array.isArray(item.teachers) && item.teachers.length > 0) {
          item.teachers.forEach((id: string) => teacherIdSet.add(id));
        }
      });
      const uniqueTeacherIds = Array.from(teacherIdSet);

      // Step 3: Fetch teacher details if any
      let teacherList: any[] = [];
      if (uniqueTeacherIds.length > 0) {
        const teacherRes = await getUserDetailsList(uniqueTeacherIds);
        teacherList = teacherRes.data || [];
      }

      // Step 4: Create teacherId -> { name, imageUrl } map
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

      // Step 5: Handle fallback for lectures with no teachers
      videoSchedule.forEach((item: any) => {
        const hasTeachers =
          Array.isArray(item.teachers) && item.teachers.length > 0;

        if (!hasTeachers && item.videoDetails?.image) {
          const fallbackId = item._id; // Use schedule _id as a unique key
          teacherMapTemp[fallbackId] = {
            name: "",
            imageUrl: item.videoDetails.image,
          };
        }
      });

      // Step 6: Update your state/UI
      setSchedule(videoSchedule);
      setTeacherMap(teacherMapTemp);
      setErrorMsg("");
    } catch (err: any) {
      let message = "Failed to fetch today's schedule.";
      if (
        err?.message?.includes("401") ||
        err?.message?.toLowerCase().includes("unauthorized")
      ) {
        message = "You are not authorized. Please log in again.";
      } else if (err?.message) {
        message = err.message;
      }
      setErrorMsg(message);
      setSchedule([]);
      setTeacherMap({});
    }
  };

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const data = await getEnrolledBatches();
        const fetchedBatches = data.enrolledBatches || [];

        setAvailableClasses(fetchedBatches);
        localStorage.setItem("enrolledBatches", JSON.stringify(fetchedBatches));
        localStorage.setItem("USER_DATA", JSON.stringify(data.user));

        // ✅ Check telegramId after storing
        // const telegramId = data?.user?.telegramId;
        // if (!telegramId || telegramId === "null" || telegramId === "") {
        //   router.replace("/check");
        //   return;
        // }

        const savedSelectionRaw = localStorage.getItem("selectedBatch");
        let finalSelectedBatch = fetchedBatches[0] || {
          _id: "",
          batchId: "",
          name: "Select Batch",
        };

        if (savedSelectionRaw && savedSelectionRaw !== "undefined") {
          try {
            const savedSelection = JSON.parse(savedSelectionRaw);
            const found = fetchedBatches.find(
              (batch: EnrolledBatch) => batch._id === savedSelection._id
            );
            if (found) finalSelectedBatch = found;
          } catch (parseError) {
            // If parsing fails, use the first batch or default
            finalSelectedBatch = fetchedBatches[0] || {
              _id: "",
              batchId: "",
              name: "Select Batch",
            };
          }
        } else {
        }

        setSelectedClass(finalSelectedBatch);
        localStorage.setItem(
          "selectedBatch",
          JSON.stringify(finalSelectedBatch)
        );

        // 👇 Fetch schedule after batch is determined
        if (finalSelectedBatch.batchId) {
          fetchTodaysSchedule(finalSelectedBatch.batchId);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          toast.error("Unauthorized: Please login again.");
        } else {
          toast.error("Failed to load enrolled batches");
        }
        console.error("Failed to load enrolled batches", err);

        // Set default state when API fails
        setAvailableClasses([]);
        setSelectedClass({
          _id: "",
          batchId: "",
          name: "Select Batch",
        });
      }
    };

    fetchBatches();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1400px]">
      {/* Class Schedule Section */}
      <div className="glass-card !rounded-2xl p-4 sm:p-6 mb-6">
        {availableClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none animate-fadeIn">
            <div className="text-5xl mb-4 animate-float">📚</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Not enrolled in any batch
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm leading-relaxed">
              Explore our educational batches, search for your curriculum, and get started on your learning journey today.
            </p>
            <button
              onClick={() => router.push("/study/batches")}
              className="mt-6 spring-btn-primary flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Enroll Now 🍃
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 outline-none">
              <div className="w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-between w-full sm:w-64 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[rgba(109,212,119,0.2)] bg-white dark:bg-[#1c2b22]/50 hover:bg-gray-50 dark:hover:bg-[#1c2b22]/80 text-sm font-semibold text-gray-800 dark:text-gray-200 transition-all duration-200 shadow-sm outline-none">
                      <span className="truncate">{selectedClass.name}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 bg-white dark:bg-[#16221b] border border-gray-200 dark:border-[rgba(109,212,119,0.2)] shadow-xl rounded-xl p-1 text-gray-900 dark:text-gray-100 z-50 animate-scaleIn">
                    {availableClasses.map((cls) => (
                      <DropdownMenuItem
                        className="px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-spring-leaf/10 cursor-pointer transition-colors duration-150 outline-none"
                        key={cls?._id}
                        onClick={() => {
                          setSelectedClass(cls);
                          localStorage.setItem(
                            "selectedBatch",
                            JSON.stringify(cls)
                          );
                          fetchTodaysSchedule(cls.batchId); // 👈 add this line
                        }}
                      >
                        {cls.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Today's Class</h3>
              <div className="rounded-lg p-3">
                {errorMsg && (
                  <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
                    {errorMsg}
                  </div>
                )}
                <div
                  ref={scrollRef}
                  className={`flex gap-4 overflow-x-auto whitespace-nowrap ${schedule.length > 0 ? "cursor-grab select-none" : ""
                    }`}
                  style={{ scrollBehavior: "smooth" }}
                  onMouseDown={schedule.length > 0 ? onMouseDown : undefined}
                  onMouseUp={schedule.length > 0 ? onMouseUp : undefined}
                  onMouseLeave={schedule.length > 0 ? onMouseLeave : undefined}
                  onMouseMove={schedule.length > 0 ? onMouseMove : undefined}
                >
                  {schedule.length === 0 ? (
                    <div className="glass-card !p-6 sm:!p-8 text-center text-foreground w-full !rounded-xl">
                      Classes not Scheduled yet
                    </div>
                  ) : (
                    schedule.map((cls: any, idx: number) => {
                      // Use first teacher if available
                      const teacherId = cls.teachers?.[0];
                      const teacher = teacherMap[teacherId] || teacherMap[cls._id]; // fallback from videoDetails

                      const teacherName = teacher?.name || ""; // no "Unknown Teacher"
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
                        const { batchId, subjectId, _id: childId, urlType } = cls;

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
                            `/watch?batchId=${batchId}&SubjectId=${subjectId?._id}&ChildId=${childId}&Type=penpencilvdo&isLocked=false`
                          );
                        } else if (urlType === "awsVideo") {
                          if (isDuring) {
                            router.push(
                              `/live?batchId=${batchId}&SubjectId=${subjectId?._id}&ChildId=${childId}&Type=awsVideo`
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
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                className="flex items-center gap-2"
                onClick={() => {
                  if (selectedClass.batchId) {
                    router.push(`/study/batches/${selectedClass.batchId}`);
                  } else {
                    toast.error("You haven't enrolled in any batches!!", {
                      style: {
                        borderRadius: "10px",
                        background: "hsl(var(--muted-foreground))",
                        color: "#fff",
                      },
                    });
                  }
                }}
              >
                View All Classes
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Resume Watching Section */}
      {watchHistory.length > 0 && (
        <div className="glass-card !rounded-2xl p-4 sm:p-6 mb-6 animate-fadeIn">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <span>🕒</span> Resume Watching
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {watchHistory.map((item: any) => (
              <div
                key={item.id}
                onClick={() => {
                  router.push(
                    `/watch?batchId=${item.batchId}&SubjectId=${item.subjectId}&ChildId=${item.id}&Type=${item.type}&VideoUrl=${item.videoUrl}&isLocked=${item.isLocked}`
                  );
                }}
                className="group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300 border border-gray-200 dark:border-transparent bg-white dark:bg-[#1c2b22]/50 hover:bg-gray-50 dark:hover:bg-[#1c2b22]/85 hover:-translate-y-1 shadow-sm hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-black/20 shrink-0">
                  <img
                    src={item.thumbnail || "/assets/img/video-placeholder.svg"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Duration badge */}
                  {item.duration && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium text-white/95 bg-black/75 backdrop-blur-sm">
                      {item.duration}
                    </span>
                  )}
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="w-10 h-10 rounded-full bg-[var(--spring-leaf)] flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Text Content */}
                <div className="p-3 flex-grow flex flex-col justify-between min-w-0">
                  <h3 className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 mb-1.5 group-hover:text-[var(--spring-leaf)] dark:group-hover:text-white transition-colors duration-200">
                    {item.title}
                  </h3>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                    Opened: {item.formattedTime || "Recently"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Batches Section */}
      {/* <div className="bg-background border rounded-lg p-4 sm:p-6 mb-6 divshadow">

</div> */}


      {/* Study Material Section */}
      <div className="glass-card !rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Join Our Community 🚀</h2>
            <p className="text-muted-foreground">
              Join our Telegram channel to receive the latest updates 📢 and
              batch information 📚
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            className="flex items-center gap-2"
            onClick={() => OpenTelegramChannel()}
          >
            Join Telegram Channel
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <PromotionPopup promotion={promotion} />

    </div>
  );
}
