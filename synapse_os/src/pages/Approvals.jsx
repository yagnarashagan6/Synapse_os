import React, { useState, useEffect } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Instagram,
  Twitter,
  Linkedin,
  Clock,
  User,
  Video,
  Play,
  Wand2,
  Send,
  Youtube,
  Music,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  getVideos,
  updateVideo,
  generateDescriptionScript,
} from "../services/videoGeneratorService";
import { API_BASE_URL } from "../config/apiConfig";
import { toast } from "react-hot-toast";

let globalApprovalsCache = null;

const Approvals = () => {
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [videos, setVideos] = useState(globalApprovalsCache || []);
  const [loading, setLoading] = useState(!globalApprovalsCache);

  useEffect(() => {
    const fetchVideos = async () => {
      if (globalApprovalsCache) {
        setVideos(globalApprovalsCache);
        setLoading(false);
        // We can do background fetch
      } else {
        setLoading(true);
      }

      try {
        const data = await getVideos();
        // Convert video data to approval item format
        // Only show videos that have been marked as 'in-approvals' in the content container
        const formatted = (data || [])
          .filter((v) => v.status === "in-approvals")
          .map((v) => ({
            id: v.id,
            title: v.topic || "AI Content Piece",
            platform: v.platform || "Social Media",
            author: "Video Generator AI",
            status: "Ready",
            date: new Date(v.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            }),
            content: `AI Generated Video for ${v.topic}. Status: Completed.`,
            video_url: v.video_url,
            language: v.language || "English",
            is_video: true,
          }));

        // Also fetch standard tasks from localStorage
        const savedTasks = localStorage.getItem("synapse_content_tasks");
        let localTasks = [];
        if (savedTasks) {
          try {
            localTasks = JSON.parse(savedTasks);
          } catch (e) {}
        }

        const formattedTasks = localTasks
          .filter((t) => t.status === "in-approvals")
          .map((t) => ({
            id: `task-${t.id}`,
            title: t.title,
            platform: t.platform || "Social Media",
            author: "Content Team",
            status: "Ready",
            date:
              t.date ||
              new Date().toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              }),
            content: t.description,
            image: null,
            language: "English",
            is_video: false,
          }));

        const combined = [...formatted, ...formattedTasks];

        const finalData =
          combined.length > 0
            ? combined
            : [
                {
                  id: "d1",
                  title: "Sustainable Tech Unboxing",
                  platform: "TikTok",
                  author: "Sarah J.",
                  status: "Ready",
                  date: "Oct 28",
                  content:
                    "Hey guys! Checking out the new EcoPhone today. The packaging is 100% biodegradable and look at this texture! 🌱 #EcoTech #Sustainability #Unboxing",
                  image:
                    "https://images.unsplash.com/photo-1542601906990-b4d3fb7d5fa5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                  language: "English",
                  is_video: false,
                },
              ];

        globalApprovalsCache = finalData;
        setVideos(finalData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch approvals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatedDescs, setGeneratedDescs] = useState({});
  const [descLanguage, setDescLanguage] = useState("English");

  // Metricool sharing state
  const SHARE_PLATFORMS = [
    {
      id: "instagram",
      label: "Instagram",
      icon: Instagram,
      color: "text-pink-500",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-500",
    },
    {
      id: "twitter",
      label: "X (Twitter)",
      icon: Twitter,
      color: "text-sky-500",
    },
    { id: "youtube", label: "YouTube", icon: Youtube, color: "text-red-500" },
    { id: "tiktok", label: "TikTok", icon: Music, color: "text-white" },
  ];
  const [selectedSharePlatforms, setSelectedSharePlatforms] = useState([]);
  const [isSharing, setIsSharing] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [profileHandles, setProfileHandles] = useState({
    // Test/development defaults - Update with actual profile handles
    instagram: "digimabbleproduct",
    linkedin: "",
    twitter: "",
    youtube: "",
    tiktok: "",
  });

  // Fetch saved profile handles on mount
  useEffect(() => {
    const fetchHandles = async () => {
      try {
        const results = await Promise.all([
          fetch(`${API_BASE_URL}/api/competitors`).then((r) => r.json()),
          fetch(`${API_BASE_URL}/api/competitors?platform=linkedin`).then((r) =>
            r.json(),
          ),
          fetch(`${API_BASE_URL}/api/competitors?platform=twitter`).then((r) =>
            r.json(),
          ),
          fetch(`${API_BASE_URL}/api/competitors?platform=youtube`).then((r) =>
            r.json(),
          ),
          fetch(`${API_BASE_URL}/api/competitors?platform=tiktok`).then((r) =>
            r.json(),
          ),
        ]);
        const merged = results.flat().filter((c) => c && !c.error);
        const own = merged.filter(
          (c) => c.scrapedData?.is_own_company === true,
        );
        const handles = {};
        own.forEach((c) => {
          let plat = "instagram";
          const src = c.scrapedData?._source || "";
          if (
            src === "WI0tj4Ieb5Kq458gB" ||
            c.scrapedData?.url?.includes("linkedin.com")
          )
            plat = "linkedin";
          else if (
            src.includes("twitter") ||
            c.scrapedData?.url?.includes("twitter.com") ||
            c.scrapedData?.url?.includes("x.com")
          )
            plat = "twitter";
          else if (
            src.includes("youtube") ||
            c.scrapedData?.url?.includes("youtube.com")
          )
            plat = "youtube";
          else if (
            src.includes("tiktok") ||
            c.scrapedData?.url?.includes("tiktok.com")
          )
            plat = "tiktok";
          handles[plat] = c.name;
        });
        // Override Instagram to explicitly be "digimabbleproduct" as requested
        handles["instagram"] = "digimabbleproduct";
        setProfileHandles(handles);
      } catch (err) {
        console.error("Failed to fetch profile handles", err);
      }
    };
    fetchHandles();
  }, []);

  const LANGUAGES = [
    "English",
    "Spanish",
    "French",
    "Portuguese",
    "German",
    "Chinese",
    "Japanese",
    "Korean",
    "Arabic",
    "Hindi",
    "Italian",
    "Dutch",
  ];

  const selectedItem = videos[selectedItemIdx] || null;

  useEffect(() => {
    if (selectedItem?.language) {
      setDescLanguage(selectedItem.language);
    }
  }, [selectedItemIdx, videos]);

  const handleGenerateDescription = async () => {
    if (!selectedItem) return;
    setGeneratingDesc(true);
    try {
      const script = await generateDescriptionScript({
        topic: selectedItem.title,
        platform: selectedItem.platform,
        language: descLanguage,
      });
      setGeneratedDescs((prev) => ({ ...prev, [selectedItem.id]: script }));
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingDesc(false);
    }
  };

  const toggleSharePlatform = (platId) => {
    setSelectedSharePlatforms((prev) =>
      prev.includes(platId)
        ? prev.filter((p) => p !== platId)
        : [...prev, platId],
    );
  };

  const handlePostMetricool = async () => {
    if (!selectedItem) return;
    if (selectedSharePlatforms.length === 0) {
      toast.error("Please select at least one platform to share to.");
      return;
    }
    const description =
      generatedDescs[selectedItem.id] || selectedItem.content || "";
    if (!description.trim()) {
      toast.error("Please generate a description first.");
      return;
    }

    setIsSharing(true);
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const platId of selectedSharePlatforms) {
      try {
        const handle = profileHandles[platId] || platId;

        console.log(`[Metricool] Sending to ${platId}...`);
        console.log(`[Metricool] Video URL: ${selectedItem.video_url}`);
        console.log(`[Metricool] Handle: ${handle}`);

        if (!selectedItem.video_url) {
          throw new Error("No video URL available. Generate a video first.");
        }

        const payload = {
          video_url: selectedItem.video_url,
          text: description,
          platform: platId,
          handle: handle,
        };

        console.log("[Metricool] Payload:", JSON.stringify(payload, null, 2));

        const response = await fetch(`${API_BASE_URL}/api/sharing/metricool`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        console.log(
          `[Metricool] Response (${response.status}):`,
          JSON.stringify(data, null, 2),
        );

        if (!response.ok || data.error) {
          const errorMsg =
            data.message ||
            data.details ||
            data.error ||
            `HTTP ${response.status}`;
          const recommendation = data.recommendation
            ? `\n💡 ${data.recommendation}`
            : "";
          throw new Error(errorMsg + recommendation);
        }

        console.log(`[Metricool] ✓ Success on ${platId}:`, data);
        toast.success(
          `✓ Content properly posted in ${platId === "instagram" ? "instagram" : platId}!`,
        );

        // Save to calendar local storage
        const postedEvent = {
          id: Date.now().toString() + Math.floor(Math.random() * 100),
          title: selectedItem.title,
          type: platId,
          handle: handle,
          content: description,
          video_url: selectedItem.video_url,
          image: selectedItem.image,
          timestamp: scheduleDateTime ? new Date(scheduleDateTime).toISOString() : new Date().toISOString(),
          isScheduled: !!scheduleDateTime,
        };
        const existingEvents = JSON.parse(
          localStorage.getItem("synapse_posted_events") || "[]",
        );
        existingEvents.push(postedEvent);
        localStorage.setItem(
          "synapse_posted_events",
          JSON.stringify(existingEvents),
        );

        successCount++;
      } catch (err) {
        const errorMsg = err.message || "Unknown error";
        console.error(`✗ Metricool share failed for ${platId}:`, errorMsg);
        errors.push(`${platId}: ${errorMsg}`);
        failCount++;
      }
    }

    setIsSharing(false);

    if (successCount > 0)
      toast.success(`Shared to ${successCount} platform(s) via Metricool! 🎉`);

    if (failCount > 0) {
      console.error("[Metricool] Errors:", errors);
      toast.error(`Failed on ${failCount} platform(s):\n${errors.join("\n")}`);
    }
  };

  const handleUpdateStatus = async (statusToSet) => {
    if (!selectedItem) return;
    try {
      if (selectedItem.is_video) {
        await updateVideo(selectedItem.id, { status: statusToSet });
      } else {
        // Handle local storage task
        const savedTasks = localStorage.getItem("synapse_content_tasks");
        if (savedTasks) {
          const tasks = JSON.parse(savedTasks);
          // the id in approvals is prefixed with 'task-'
          const originalId = parseInt(selectedItem.id.replace("task-", ""), 10);
          const updatedTasks = tasks.map((t) =>
            t.id === originalId ? { ...t, status: statusToSet } : t,
          );
          localStorage.setItem(
            "synapse_content_tasks",
            JSON.stringify(updatedTasks),
          );
        }
      }

      // Remove from the local UI list
      setVideos((prev) => prev.filter((v) => v.id !== selectedItem.id));
      setSelectedItemIdx(0); // reset selection
    } catch (err) {
      console.error(`Failed to mark item as ${statusToSet}:`, err);
      alert(`Failed to update status to ${statusToSet}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Approval Queue */}
      <Card className="flex flex-col h-full">
        <h2 className="text-xl font-bold text-white mb-4">Approval Queue</h2>
        <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading
            ? [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-slate-800/30 rounded-xl animate-pulse"
                />
              ))
            : videos.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemIdx(idx)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedItemIdx === idx ? "bg-purple-500/10 border-purple-500/50" : "bg-slate-800/30 border-slate-700/50 hover:bg-slate-700/30"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={
                        item.status === "Ready"
                          ? "success"
                          : item.status === "Revision"
                            ? "warning"
                            : "default"
                      }
                    >
                      {item.status}
                    </Badge>
                    {item.is_video && (
                      <Video size={14} className="text-purple-400" />
                    )}
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {item.date}
                    </div>
                  </div>
                  <h3 className="font-medium text-slate-200 mb-1 line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <User size={12} /> {item.author} • {item.platform}
                  </p>
                </div>
              ))}
        </div>
      </Card>

      {/* Content Preview */}
      <div className="lg:col-span-2 h-full flex flex-col">
        <Card className="flex-1 flex flex-col h-full bg-slate-900/50">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <User size={20} className="text-slate-400" />
              </div>
              {selectedItem ? (
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {selectedItem.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Created by {selectedItem.author} • {selectedItem.platform}
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-white text-lg">
                    No Item Selected
                  </h3>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <AlertCircle size={20} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mb-6 custom-scrollbar">
            {selectedItem && (
              <div className="bg-black/20 rounded-xl p-6 border border-slate-800/50 max-w-2xl mx-auto">
                {selectedItem.is_video ? (
                  <div className="aspect-video bg-black rounded-xl mb-6 overflow-hidden border border-slate-700 shadow-2xl relative group">
                    {selectedItem.video_url?.toLowerCase().includes(".gif") ||
                    selectedItem.video_url?.toLowerCase().includes(".webp") ||
                    selectedItem.video_url?.toLowerCase().includes("/gif/") ? (
                      <img
                        src={selectedItem.video_url}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <video
                        src={selectedItem.video_url}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                ) : (
                  selectedItem.image && (
                    <div className="aspect-video bg-slate-800 rounded-lg mb-4 overflow-hidden">
                      <img
                        src={selectedItem.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )
                )}
                <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedItem.content}
                </p>

                <div className="mt-8 border-t border-slate-700/50 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Wand2 size={16} className="text-purple-400" /> AI
                      Description
                    </h4>
                    <div className="flex items-center gap-3">
                      <select
                        value={descLanguage}
                        onChange={(e) => setDescLanguage(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500 transition-colors"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleGenerateDescription}
                        disabled={generatingDesc}
                        className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30"
                      >
                        {generatingDesc
                          ? "Generating..."
                          : "Generate AI Description"}
                      </Button>
                    </div>
                  </div>
                  <textarea
                    className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-colors resize-none"
                    placeholder="Click 'Generate AI Description' to create a localized post caption based on the selected language..."
                    value={generatedDescs[selectedItem.id] || ""}
                    onChange={(e) =>
                      setGeneratedDescs((prev) => ({
                        ...prev,
                        [selectedItem.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-700/50 space-y-4">
            {/* Platform Selector for Metricool */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
                Share To Platforms
              </label>
              <div className="flex flex-wrap gap-2">
                {SHARE_PLATFORMS.map((plat) => {
                  const Icon = plat.icon;
                  const isActive = selectedSharePlatforms.includes(plat.id);
                  const hasHandle = !!profileHandles[plat.id];
                  return (
                    <button
                      key={plat.id}
                      onClick={() => toggleSharePlatform(plat.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-xs font-medium ${
                        isActive
                          ? "bg-purple-600/20 border-purple-500 text-purple-200"
                          : "bg-slate-800/50 border-slate-700/50 text-gray-400 hover:border-slate-500"
                      }`}
                    >
                      <Icon
                        size={14}
                        className={isActive ? plat.color : "text-gray-500"}
                      />
                      {plat.label}
                      {hasHandle && (
                        <CheckCircle size={10} className="text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedSharePlatforms.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSharePlatforms.map((pid) => (
                    <span
                      key={pid}
                      className="text-[10px] text-gray-500 bg-slate-800 px-2 py-0.5 rounded-full"
                    >
                      {profileHandles[pid]
                        ? `@${profileHandles[pid]}`
                        : `${pid} (no handle saved)`}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="danger"
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs px-3"
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={!selectedItem}
                >
                  <XCircle size={14} className="mr-1.5" /> Reject
                </Button>
                <Button
                  variant="secondary"
                  className="text-orange-400 hover:text-orange-300 border-orange-500/30 hover:bg-orange-500/10 text-xs px-3"
                  onClick={() => handleUpdateStatus("in-progress")}
                  disabled={!selectedItem}
                >
                  <AlertCircle size={14} className="mr-1.5" /> Request Revision
                </Button>
                <Button
                  variant="primary"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20 text-xs px-3"
                  onClick={() => handleUpdateStatus("approved")}
                  disabled={!selectedItem}
                >
                  <CheckCircle size={14} className="mr-1.5" /> Approve Content
                </Button>
              </div>

              <div className="flex items-center justify-end gap-3 flex-wrap">
                <input
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-500 transition-colors"
                />
                <Button
                  onClick={handlePostMetricool}
                  disabled={isSharing || selectedSharePlatforms.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/20 text-white disabled:opacity-50 text-sm px-4"
                >
                  {isSharing ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : (
                    scheduleDateTime ? <Clock size={16} className="mr-2" /> : <Send size={16} className="mr-2" />
                  )}
                  {isSharing
                    ? "Processing..."
                    : scheduleDateTime
                    ? `Schedule (${selectedSharePlatforms.length})` 
                    : `Share Now (${selectedSharePlatforms.length})`}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Approvals;
