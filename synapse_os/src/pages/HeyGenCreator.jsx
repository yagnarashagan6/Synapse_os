import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";
import {
  Play,
  Pause,
  Search,
  Filter,
  Video,
  Mic,
  ChevronDown,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  Volume2,
  SlidersHorizontal,
  RefreshCw,
  ExternalLink,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Music2,
} from "lucide-react";
import { HEYGEN_AVATARS, HEYGEN_VOICES } from "../config/heygenData";
import { saveVideo } from "../services/hygenService";

// ─── helpers ────────────────────────────────────────────────────────────────
const LANGUAGES = [
  "All",
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
const GENDERS = ["All", "male", "female"];
const SIZES = [
  { label: "9:16 (TikTok / Reels)", w: 1080, h: 1920 },
  { label: "16:9 (YouTube / Landscape)", w: 1920, h: 1080 },
  { label: "1:1 (Instagram Square)", w: 1080, h: 1080 },
  { label: "4:5 (Instagram Portrait)", w: 1080, h: 1350 },
];
const BG_PRESETS = [
  { label: "Off White", value: "#f5f5f5" },
  { label: "Pure White", value: "#ffffff" },
  { label: "Dark Studio", value: "#1a1a2e" },
  { label: "Gradient Blue", value: "#0f3460" },
  { label: "Soft Purple", value: "#4a1a6b" },
  { label: "Forest Green", value: "#1a3d2b" },
];

const PLATFORMS_DATA = [
  { id: "instagram", label: "Instagram", icon: Instagram, ratios: ["1:1", "4:5", "9:16"] },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, ratios: ["16:9", "1:1"] },
  { id: "tiktok", label: "TikTok", icon: Music2, ratios: ["9:16"] },
  { id: "youtube", label: "YouTube", icon: Youtube, ratios: ["16:9", "9:16"] },
  { id: "twitter", label: "Twitter", icon: Twitter, ratios: ["16:9", "1:1"] },
];

// ─── AvatarCard ──────────────────────────────────────────────────────────────
const AvatarCard = ({ avatar, selected, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef(null);

  const handleMouseEnter = () => {
    setHovered(true);
    if (videoRef.current && avatar.preview_video_url) {
      videoRef.current.play().catch(() => {});
    }
  };
  const handleMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      onClick={() => onSelect(avatar)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group border-2 ${
        selected
          ? "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
          : "border-white/10 hover:border-white/30"
      }`}
    >
      {/* Preview Image */}
      {avatar.preview_image_url ? (
        <img
          src={avatar.preview_image_url}
          alt={avatar.avatar_name}
          className={`w-full aspect-[3/4] object-cover transition-opacity duration-300 ${hovered && avatar.preview_video_url ? "opacity-0" : "opacity-100"}`}
        />
      ) : (
        <div className="w-full aspect-[3/4] bg-gray-800 flex items-center justify-center">
          <span className="text-gray-400 text-xs">No Preview</span>
        </div>
      )}

      {/* Preview Video overlay */}
      {avatar.preview_video_url && (
        <video
          ref={videoRef}
          src={avatar.preview_video_url}
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovered ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {/* Hover hint */}
      {!hovered && avatar.preview_video_url && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 flex items-center justify-center gap-1">
          <Play size={10} className="text-white" />
          <span className="text-white text-[10px]">Hover to preview</span>
        </div>
      )}

      {/* Selected badge */}
      {selected && (
        <div className="absolute top-2 right-2 bg-purple-600 rounded-full p-0.5">
          <CheckCircle2 size={16} className="text-white" />
        </div>
      )}

      {/* Gender badge */}
      <div className="absolute top-2 left-2">
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            avatar.gender === "female"
              ? "bg-pink-500/80 text-white"
              : "bg-blue-500/80 text-white"
          }`}
        >
          {avatar.gender}
        </span>
      </div>

      {/* Name */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-2 py-3">
        <p className="text-white text-xs font-medium truncate">
          {avatar.avatar_name}
        </p>
      </div>
    </div>
  );
};

// ─── VoiceCard ───────────────────────────────────────────────────────────────
const VoiceCard = ({ voice, selected, onSelect }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!voice.preview_audio) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(voice.preview_audio);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div
      onClick={() => onSelect(voice)}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
        selected
          ? "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
      }`}
    >
      {/* Play Button */}
      <button
        onClick={togglePlay}
        disabled={!voice.preview_audio}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          voice.preview_audio
            ? "bg-purple-600 hover:bg-purple-500 text-white"
            : "bg-gray-600 text-gray-400 cursor-not-allowed"
        }`}
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{voice.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-gray-400">{voice.language}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              voice.gender === "female"
                ? "bg-pink-500/30 text-pink-300"
                : "bg-blue-500/30 text-blue-300"
            }`}
          >
            {voice.gender}
          </span>
          {voice.emotion_support && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/30 text-green-300">
              Emotion
            </span>
          )}
        </div>
      </div>

      {/* Selected check */}
      {selected && (
        <CheckCircle2 size={18} className="text-purple-400 flex-shrink-0" />
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function HeyGenCreator() {
  // Data
  const [avatars] = useState(HEYGEN_AVATARS);
  const [voices] = useState(HEYGEN_VOICES);
  const [loadingAvatars] = useState(false);
  const [loadingVoices] = useState(false);
  const [dataError, setDataError] = useState("");

  // Filters
  const [avatarSearch, setAvatarSearch] = useState("");
  const [avatarGender, setAvatarGender] = useState("All");
  const [voiceSearch, setVoiceSearch] = useState("");
  const [voiceGender, setVoiceGender] = useState("All");
  const [voiceLang, setVoiceLang] = useState("English");
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS_DATA[0]);

  // Selections
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Video settings
  const [topic, setTopic] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [bgColor, setBgColor] = useState(BG_PRESETS[0].value);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);
  const [avatarStyle, setAvatarStyle] = useState("normal");

  // Generation
  const [generating, setGenerating] = useState(false);
  const [generatingScript, setGeneratingScript] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const [generatedVideoId, setGeneratedVideoId] = useState("");
  const [genError, setGenError] = useState("");

  // Active tab
  const [activeTab, setActiveTab] = useState("avatars"); // 'avatars' | 'voices' | 'settings'

  // Handle incoming topic from navigation state
  const location = useLocation();
  useEffect(() => {
    if (location.state?.defaultTopic) {
      setTopic(location.state.defaultTopic);
      // Optional: automatically generate script if topic is provided
      // generateScript(); // We might not want to auto-run this immediately to allow user to tweak
    }
  }, [location.state]);

  // Set default selections
  useEffect(() => {
    // Pre-select Abigail as default
    const abigail = avatars.find(
      (a) => a.avatar_id === "Abigail_expressive_2024112501",
    );
    if (abigail) setSelectedAvatar(abigail);

    // Pre-select Allison as default voice
    const allison = voices.find(
      (v) => v.voice_id === "f8c69e517f424cafaecde32dde57096b",
    );
    if (allison) setSelectedVoice(allison);
  }, [avatars, voices]);

  // Filtered avatars
  const filteredAvatars = avatars.filter((a) => {
    const matchSearch =
      !avatarSearch ||
      a.avatar_name?.toLowerCase().includes(avatarSearch.toLowerCase());
    const matchGender = avatarGender === "All" || a.gender === avatarGender;
    return matchSearch && matchGender;
  });

  // Filtered voices
  const filteredVoices = voices.filter((v) => {
    const matchSearch =
      !voiceSearch || v.name?.toLowerCase().includes(voiceSearch.toLowerCase());
    const matchGender = voiceGender === "All" || v.gender === voiceGender;
    const matchLang = voiceLang === "All" || v.language === voiceLang;
    return matchSearch && matchGender && matchLang;
  });

  // Filtered sizes based on platform
  const filteredSizes = SIZES.filter((s) => {
    const ratioLabel = s.label.split(" ")[0];
    return selectedPlatform.ratios.includes(ratioLabel);
  });

  // Auto-generate script
  const generateScript = async () => {
    if (!topic.trim()) return;
    setGeneratingScript(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/hygen/generate-script`,
        {
          topic,
          platform: selectedPlatform.label,
          tone: "Professional",
          cta: "Learn More",
        },
      );
      setScriptText(res.data.script || "");
    } catch {
      // silent
    } finally {
      setGeneratingScript(false);
    }
  };

  // Poll video status
  const pollStatus = useCallback(async (videoId) => {
    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 15000));
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/hygen/status?video_id=${videoId}`,
        );
        const status = res.data?.data?.status;
        if (status === "completed") {
          return res.data?.data?.video_url || "";
        }
        if (status === "failed") {
          throw new Error("HeyGen reported video generation failed.");
        }
        setGenerationStatus(`Rendering... (${status || "processing"})`);
      } catch (err) {
        if (err.message?.includes("failed")) throw err;
        // Network hiccup — keep polling
      }
    }
    throw new Error("Timed out waiting for video.");
  }, []);

  // Generate video
  const handleGenerate = async () => {
    if (!selectedAvatar) {
      setGenError("Please select an avatar first.");
      return;
    }
    if (!selectedVoice) {
      setGenError("Please select a voice first.");
      return;
    }
    if (!scriptText.trim() && !topic.trim()) {
      setGenError("Please enter a topic or script.");
      return;
    }

    setGenerating(true);
    setGenError("");
    setGeneratedVideoUrl("");
    setGenerationStatus("Sending to HeyGen...");

    try {
      const res = await axios.post(`${API_BASE_URL}/api/hygen/generate`, {
        avatar_id: selectedAvatar.avatar_id,
        avatar_style: avatarStyle,
        voice_id: selectedVoice.voice_id,
        scriptText: scriptText || topic,
        topic: topic || "Synapse AI Video",
        width: selectedSize.w,
        height: selectedSize.h,
        background_color: bgColor,
        speed,
        pitch,
      });

      const videoId = res.data?.data?.video_id;
      if (!videoId) throw new Error("No video ID returned from HeyGen.");

      setGeneratedVideoId(videoId);
      setGenerationStatus("Video queued — rendering in progress...");

      const videoUrl = await pollStatus(videoId);
      setGeneratedVideoUrl(videoUrl);
      setGenerationStatus("Done!");

      // AUTO-SAVE to Supabase
      try {
        await saveVideo({
          video_id: videoId,
          video_url: videoUrl,
          topic: topic || "Synapse AI Video",
          platform: selectedPlatform.label,
          ratio: selectedSize.label.split(" ")[0],
          tone: "Professional",
          cta: "",
        });
        console.log("Video saved to Supabase successfully.");
      } catch (saveErr) {
        console.warn("Failed to auto-save to Supabase:", saveErr.message);
      }
    } catch (err) {
      setGenError(
        err.response?.data?.message ||
          err.message ||
          "Video generation failed.",
      );
      setGenerationStatus("");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const tabClass = (tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-all ${
      activeTab === tab
        ? "bg-purple-600 text-white shadow-lg"
        : "text-gray-400 hover:text-white hover:bg-white/10"
    }`;

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Video size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              HeyGen Video Creator
            </h1>
            <p className="text-gray-400 text-sm">
              Select an avatar & voice, then generate your AI video
            </p>
          </div>
        </div>
      </div>

      {/* Platform Selection Chips */}
      <div className="mb-6 overflow-x-auto no-scrollbar pb-2">
        <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          Select Target Platform
        </label>
        <div className="flex items-center gap-3 w-max">
          {PLATFORMS_DATA.map((p) => {
            const Icon = p.icon;
            const isActive = selectedPlatform.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPlatform(p)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 ${
                  isActive
                    ? "bg-purple-600/20 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
                <span className="font-semibold text-sm">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {dataError && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-sm">
          <AlertCircle size={16} />
          {dataError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* ── Left: Avatar + Voice Selector ── */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("avatars")}
              className={tabClass("avatars")}
            >
              <span className="flex items-center gap-2">
                <Video size={14} /> Avatars
                {selectedAvatar && (
                  <CheckCircle2 size={12} className="text-purple-300" />
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("voices")}
              className={tabClass("voices")}
            >
              <span className="flex items-center gap-2">
                <Mic size={14} /> Voices
                {selectedVoice && (
                  <CheckCircle2 size={12} className="text-purple-300" />
                )}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={tabClass("settings")}
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={14} /> Settings
              </span>
            </button>
          </div>

          {/* ── AVATARS TAB ── */}
          {activeTab === "avatars" && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Video size={16} className="text-purple-400" />
                  Choose Avatar
                  <span className="text-xs text-gray-400 font-normal">
                    (
                    {loadingAvatars
                      ? "..."
                      : `${filteredAvatars.length} of ${avatars.length}`}
                    )
                  </span>
                </h2>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-1 min-w-[180px]">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search avatars..."
                    value={avatarSearch}
                    onChange={(e) => setAvatarSearch(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-1">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setAvatarGender(g)}
                      className={`px-3 py-2 text-xs rounded-lg transition-all ${
                        avatarGender === g
                          ? "bg-purple-600 text-white"
                          : "bg-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      {g === "All" ? "All" : g === "female" ? "Female" : "Male"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected avatar banner */}
              {selectedAvatar && (
                <div className="mb-3 p-3 bg-purple-900/30 border border-purple-500/30 rounded-xl flex items-center gap-3">
                  <img
                    src={selectedAvatar.preview_image_url}
                    alt={selectedAvatar.avatar_name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {selectedAvatar.avatar_name}
                    </p>
                    <p className="text-xs text-purple-300">Selected Avatar</p>
                  </div>
                  <button
                    onClick={() => setSelectedAvatar(null)}
                    className="ml-auto text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Grid */}
              {loadingAvatars ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-purple-400" />
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-4 2xl:grid-cols-6 gap-2 max-h-[480px] overflow-y-auto pr-1">
                  {filteredAvatars.map((avatar) => (
                    <AvatarCard
                      key={avatar.avatar_id}
                      avatar={avatar}
                      selected={selectedAvatar?.avatar_id === avatar.avatar_id}
                      onSelect={setSelectedAvatar}
                    />
                  ))}
                  {filteredAvatars.length === 0 && (
                    <div className="col-span-full text-center py-8 text-gray-400 text-sm">
                      No avatars match your search
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── VOICES TAB ── */}
          {activeTab === "voices" && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Mic size={16} className="text-purple-400" />
                  Choose Voice
                  <span className="text-xs text-gray-400 font-normal">
                    (
                    {loadingVoices
                      ? "..."
                      : `${filteredVoices.length} of ${voices.length}`}
                    )
                  </span>
                </h2>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="relative flex-1 min-w-[160px]">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Search voices..."
                    value={voiceSearch}
                    onChange={(e) => setVoiceSearch(e.target.value)}
                    className="w-full bg-white/10 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <select
                  value={voiceLang}
                  onChange={(e) => setVoiceLang(e.target.value)}
                  className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setVoiceGender(g)}
                      className={`px-3 py-2 text-xs rounded-lg transition-all ${
                        voiceGender === g
                          ? "bg-purple-600 text-white"
                          : "bg-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      {g === "All" ? "All" : g === "female" ? "F" : "M"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected voice banner */}
              {selectedVoice && (
                <div className="mb-3 p-3 bg-purple-900/30 border border-purple-500/30 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-700 flex items-center justify-center flex-shrink-0">
                    <Volume2 size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {selectedVoice.name}
                    </p>
                    <p className="text-xs text-purple-300">
                      {selectedVoice.language} · {selectedVoice.gender}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedVoice(null)}
                    className="ml-auto text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Voice List */}
              {loadingVoices ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-purple-400" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                  {filteredVoices.map((voice) => (
                    <VoiceCard
                      key={voice.voice_id}
                      voice={voice}
                      selected={selectedVoice?.voice_id === voice.voice_id}
                      onSelect={setSelectedVoice}
                    />
                  ))}
                  {filteredVoices.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No voices match your filters
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-5">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-purple-400" />
                Video Settings
              </h2>

              {/* Video Size */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Video Dimensions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {filteredSizes.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setSelectedSize(s)}
                      className={`p-3 text-sm rounded-xl text-left transition-all border ${
                        selectedSize.label === s.label
                          ? "border-purple-500 bg-purple-500/10 text-white"
                          : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <span className="font-medium block">
                        {s.label.split(" ")[0]}
                      </span>
                      <span className="text-xs opacity-70">
                        {s.label.split(" ").slice(1).join(" ")}
                      </span>
                      <span className="text-xs block mt-0.5 opacity-50">
                        {s.w}×{s.h}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Background Color
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {BG_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setBgColor(p.value)}
                      className={`p-2 rounded-lg text-xs text-center border transition-all ${
                        bgColor === p.value
                          ? "border-purple-500"
                          : "border-white/10"
                      }`}
                    >
                      <div
                        className="w-full h-8 rounded-md mb-1 mx-auto"
                        style={{
                          backgroundColor: p.value,
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white w-28 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-xs text-gray-400">Custom hex</span>
                </div>
              </div>

              {/* Avatar Style */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Avatar Style
                </label>
                <div className="flex gap-2">
                  {["normal", "circle", "closeup"].map((style) => (
                    <button
                      key={style}
                      onClick={() => setAvatarStyle(style)}
                      className={`px-4 py-2 text-sm rounded-lg capitalize transition-all border ${
                        avatarStyle === style
                          ? "border-purple-500 bg-purple-500/10 text-white"
                          : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed & Pitch */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Speaking Speed:
                    <span className="text-white ml-1">{speed.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>2.0x</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Pitch:
                    <span className="text-white ml-1">
                      {pitch > 0 ? `+${pitch}` : pitch}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={1}
                    value={pitch}
                    onChange={(e) => setPitch(parseInt(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-10</span>
                    <span>0</span>
                    <span>+10</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Script Input + Preview + Generate ── */}
        <div className="space-y-4">
          {/* Selected Summary */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Your Selection
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {selectedAvatar?.preview_image_url ? (
                  <img
                    src={selectedAvatar.preview_image_url}
                    alt=""
                    className="w-12 h-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-16 rounded-lg bg-gray-700 flex items-center justify-center">
                    <Video size={16} className="text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">Avatar</p>
                  <p className="text-sm font-medium text-white">
                    {selectedAvatar?.avatar_name || (
                      <span className="text-gray-500 italic">Not selected</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                  <Volume2 size={18} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Voice</p>
                  <p className="text-sm font-medium text-white">
                    {selectedVoice?.name || (
                      <span className="text-gray-500 italic">Not selected</span>
                    )}
                  </p>
                  {selectedVoice && (
                    <p className="text-xs text-gray-400">
                      {selectedVoice.language} · {selectedVoice.gender}
                    </p>
                  )}
                </div>
              </div>
              <div className="h-px bg-white/10" />
              <div className="text-xs text-gray-400 flex flex-wrap gap-3">
                <span>
                  Size:{" "}
                  <span className="text-white">
                    {selectedSize.w}×{selectedSize.h}
                  </span>
                </span>
                <span>
                  Speed: <span className="text-white">{speed}x</span>
                </span>
                <span>
                  Style:{" "}
                  <span className="text-white capitalize">{avatarStyle}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Script Input */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Script</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Topic (for AI script generation)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. AI productivity tools for marketers"
                  className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={generateScript}
                  disabled={generatingScript || !topic.trim()}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  {generatingScript ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  AI Write
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Script Text
                <span className="ml-2 text-gray-500">
                  ({(scriptText || "").split(/\s+/).filter(Boolean).length}{" "}
                  words)
                </span>
              </label>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={6}
                placeholder="Type or generate your video script here... For best results keep it under 150 words."
                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/30"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {generationStatus || "Generating..."}
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate Video
              </>
            )}
          </button>

          {/* Error */}
          {genError && (
            <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-300 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{genError}</span>
            </div>
          )}

          {/* Video Output */}
          {generatedVideoUrl && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Video Ready!
                </h3>
                <a
                  href={generatedVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Open
                </a>
              </div>
              <video
                src={generatedVideoUrl}
                controls
                className="w-full rounded-xl max-h-[400px] object-contain bg-black"
              />
              {generatedVideoId && (
                <p className="text-xs text-gray-500">
                  Video ID: {generatedVideoId}
                </p>
              )}
            </div>
          )}

          {/* Rendering status */}
          {generating && (
            <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 size={16} className="animate-spin text-blue-400" />
                <span className="text-sm text-blue-300">
                  {generationStatus}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                HeyGen renders in the cloud — this typically takes 3–15 minutes
                depending on length.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
