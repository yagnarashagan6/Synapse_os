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
  Camera,
  Upload,
  MicOff,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  saveVideo,
  getVideoGeneratorAvatars,
  getVideoGeneratorVoices,
  uploadImage,
  uploadVideoGeneratorAsset,
  transcribeAudio,
} from "../services/videoGeneratorService";

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
  {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    ratios: ["1:1", "4:5", "9:16"],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    ratios: ["16:9", "1:1"],
  },
  { id: "tiktok", label: "TikTok", icon: Music2, ratios: ["9:16"] },
  { id: "youtube", label: "YouTube", icon: Youtube, ratios: ["16:9", "9:16"] },
  { id: "twitter", label: "Twitter", icon: Twitter, ratios: ["16:9", "1:1"] },
];

const POPULAR_VOICES = [
  "Bella",
  "Callum",
  "Charlie",
  "Clyde",
  "Daniel",
  "Dora",
  "Fin",
  "Freya",
  "Grayson",
  "Greg",
  "Hannah",
  "Harry",
  "Isaac",
  "James",
  "Jessie",
  "Liam",
  "Matilda",
  "Michael",
  "Mimi",
  "Missy",
  "Ollie",
  "Oscar",
  "Paul",
  "Peter",
  "Rachel",
  "Ryan",
  "Sam",
  "Sophia",
  "Steve",
  "Stuart",
  "Thomas",
  "Tommy",
  "Victoria",
  "Will",
  "Xander",
  "Yuki",
  "Zahra",
  "Zen",
  "Zeus",
  "Zoe",
  "Alloy",
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
export default function VideoGenerator() {
  // Data
  const [avatars, setAvatars] = useState([]);
  const [voices, setVoices] = useState([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [dataError, setDataError] = useState("");

  const [uploadingBg, setUploadingBg] = useState(false);

  // Fetch initial data
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [avs, vos] = await Promise.all([
          getVideoGeneratorAvatars(),
          getVideoGeneratorVoices(),
        ]);
        if (!mounted) return;
        setAvatars(avs || []);
        setVoices(vos || []);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load Video Generator data", err);
        setDataError(
          "Failed to fetch dynamic avatars and voices from Video Generator.",
        );
      } finally {
        if (mounted) {
          setLoadingAvatars(false);
          setLoadingVoices(false);
        }
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch ElevenLabs voices
  useEffect(() => {
    const fetchElevenLabs = async () => {
      setLoadingElevenLabs(true);
      setElevenLabsError("");
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/video-generator/elevenlabs/voices`,
        );
        setElevenLabsVoices(res.data.voices || []);
        if (res.data.voices?.length > 0) {
          setSelectedElevenLabsVoice(res.data.voices[0]);
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.error ||
          err.message ||
          "Failed to load ElevenLabs voices";
        console.error("Failed to fetch ElevenLabs voices", err);
        setElevenLabsError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoadingElevenLabs(false);
      }
    };
    fetchElevenLabs();
  }, []);

  // Filters
  const [avatarSearch, setAvatarSearch] = useState("");
  const [avatarGender, setAvatarGender] = useState("All");
  const [voiceSearch, setVoiceSearch] = useState("");
  const [voiceGender, setVoiceGender] = useState("All");
  const [voiceLang, setVoiceLang] = useState("English");
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS_DATA[0]);

  // Pagination
  const [avatarPage, setAvatarPage] = useState(1);
  const [voicePage, setVoicePage] = useState(1);
  const ITEMS_PER_PAGE = 18;

  // Selections
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);

  // Video settings
  const [topic, setTopic] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [selectedSize, setSelectedSize] = useState(SIZES[0]);
  const [bgType, setBgType] = useState("color");
  const [bgColor, setBgColor] = useState(BG_PRESETS[0].value);
  const [bgUrl, setBgUrl] = useState("");
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
  const [activeTab, setActiveTab] = useState("avatars"); // 'avatars' | 'voices' | 'elevenlabs' | 'settings'

  // ElevenLabs State
  const [elevenLabsVoices, setElevenLabsVoices] = useState([]);
  const [loadingElevenLabs, setLoadingElevenLabs] = useState(false);
  const [elevenLabsError, setElevenLabsError] = useState("");
  const [selectedElevenLabsVoice, setSelectedElevenLabsVoice] = useState(null);
  const [elevenLabsVoiceSearch, setElevenLabsVoiceSearch] = useState("");
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState("");
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [playingElevenLabsAudio, setPlayingElevenLabsAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [previewingVoiceId, setPreviewingVoiceId] = useState(null);
  const elevenLabsAudioRef = useRef(null);
  const voicePreviewRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Cloning state for ElevenLabs
  const [cloneName, setCloneName] = useState("");
  const [cloneFiles, setCloneFiles] = useState([]);
  const [cloning, setCloning] = useState(false);
  const [cloneError, setCloneError] = useState("");
  // Recording helpers for cloning samples
  const [cloneRecording, setCloneRecording] = useState(false);
  const cloneMediaRecorderRef = useRef(null);
  const cloneAudioChunksRef = useRef([]);
  const cloneStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const playingAudioRef = useRef(null);

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
  const paginatedAvatars = filteredAvatars.slice(
    (avatarPage - 1) * ITEMS_PER_PAGE,
    avatarPage * ITEMS_PER_PAGE,
  );
  const totalAvatarPages = Math.ceil(filteredAvatars.length / ITEMS_PER_PAGE);

  const filteredVoices = voices.filter((v) => {
    const matchSearch =
      !voiceSearch || v.name?.toLowerCase().includes(voiceSearch.toLowerCase());
    const matchGender = voiceGender === "All" || v.gender === voiceGender;
    const matchLang = voiceLang === "All" || v.language === voiceLang;
    return matchSearch && matchGender && matchLang;
  });
  const paginatedVoices = filteredVoices.slice(
    (voicePage - 1) * ITEMS_PER_PAGE,
    voicePage * ITEMS_PER_PAGE,
  );
  const totalVoicePages = Math.ceil(filteredVoices.length / ITEMS_PER_PAGE);

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
        `${API_BASE_URL}/api/video-generator/generate-script`,
        {
          topic,
          platform: selectedPlatform.label,
          tone: "Professional",
          cta: "Learn More",
          language: voiceLang || "English",
        },
      );
      setScriptText(res.data.script || "");
    } catch {
      // silent
    } finally {
      setGeneratingScript(false);
    }
  };

  // ─── Audio Recording Functions ─────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setIsRecording(false);

        const loadingToast = toast.loading("Transcribing audio...");
        try {
          const text = await transcribeAudio(audioBlob, voiceLang);
          setScriptText((prev) => (prev ? prev + " " + text : text));
          toast.success("Transcription added!", { id: loadingToast });
        } catch (err) {
          toast.error("Transcription failed: " + err.message, {
            id: loadingToast,
          });
        }

        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Could not access microphone: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleGenerateElevenLabsAudio = async () => {
    if (!scriptText.trim()) {
      toast.error("Please enter a script first.");
      return;
    }
    if (!selectedElevenLabsVoice) {
      toast.error("Please select an ElevenLabs voice.");
      return;
    }

    setGeneratingAudio(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/video-generator/elevenlabs/tts`,
        {
          text: scriptText,
          voice_id: selectedElevenLabsVoice.voice_id,
          stability,
          similarity_boost: similarityBoost,
        },
      );
      const audioUrl = res.data.audio_url;
      setGeneratedAudioUrl(audioUrl);
      setPlayingElevenLabsAudio(false);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      toast.success("Audio generated successfully! 🎉");

      // Auto-generate video if avatar is already selected
      if (selectedAvatar) {
        setTimeout(() => {
          toast.promise(
            handleGenerateVideoWithAudio(audioUrl),
            {
              loading: "Generating video with your audio...",
              success: "Video generation started!",
              error: (err) => `Failed to generate video: ${err.message}`,
            },
            {
              style: {
                background: "rgba(20, 20, 30, 0.9)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              },
              success: { duration: 4000 },
              error: { duration: 6000 },
            },
          );
        }, 500);
      } else {
        toast.info(
          "Select an avatar, then click Generate Video to create your video",
        );
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.details || err.response?.data?.error || err.message;
      console.error("Audio generation error:", errorMsg);
      toast.error("Failed to generate audio: " + errorMsg);
      setElevenLabsError("Error: " + errorMsg);
    } finally {
      setGeneratingAudio(false);
    }
  };

  // Handle clone file selection
  const handleCloneFilesChange = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setCloneFiles(files);
    setCloneError("");
  };

  // Create a cloned voice via backend (which forwards to ElevenLabs)
  const handleCreateClone = async () => {
    if (!cloneName || !cloneName.trim()) {
      setCloneError("Please provide a name for the cloned voice.");
      return;
    }
    if (!cloneFiles || cloneFiles.length === 0) {
      setCloneError("Please upload at least one audio sample.");
      return;
    }

    setCloning(true);
    setCloneError("");
    try {
      const fd = new FormData();
      fd.append("name", cloneName.trim());
      fd.append("description", "Created via Synapse OS UI");
      cloneFiles.forEach((file) => fd.append("samples", file));

      const res = await axios.post(
        `${API_BASE_URL}/api/video-generator/elevenlabs/voices/clone`,
        fd,
      );

      const created = res.data?.created_voice;
      if (created) {
        toast.success(`Cloned voice created: ${created.name}`);

        // Refresh voices list from server to ensure consistency
        try {
          const voicesRes = await axios.get(
            `${API_BASE_URL}/api/video-generator/elevenlabs/voices`,
          );
          setElevenLabsVoices(voicesRes.data.voices || []);
        } catch (err) {
          // fallback: append created voice locally
          setElevenLabsVoices((prev) => [created, ...(prev || [])]);
        }

        // Select the newly created voice
        setSelectedElevenLabsVoice(created);
        setCloneName("");
        setCloneFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = null;
      } else {
        throw new Error("No created voice returned from server");
      }
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || "Failed to create clone";
      console.error("Create clone error:", err.response || err.message);
      setCloneError(message);
      toast.error("Failed to create cloned voice: " + message);
    } finally {
      setCloning(false);
    }
  };

  // Recording & sample helpers for cloning
  const startCloneRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      cloneStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      cloneMediaRecorderRef.current = mediaRecorder;
      cloneAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) cloneAudioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(cloneAudioChunksRef.current, {
          type: "audio/webm",
        });
        const filename = `recording_${Date.now()}.webm`;
        try {
          const file = new File([blob], filename, { type: blob.type });
          setCloneFiles((prev) => [...(prev || []), file]);
        } catch (err) {
          const fallback = blob;
          fallback.name = filename;
          setCloneFiles((prev) => [...(prev || []), fallback]);
        }

        try {
          cloneStreamRef.current?.getTracks().forEach((t) => t.stop());
        } catch (e) {}
        cloneStreamRef.current = null;
        cloneMediaRecorderRef.current = null;
        cloneAudioChunksRef.current = [];
        setCloneRecording(false);
      };

      mediaRecorder.start();
      setCloneRecording(true);
      toast.success("Recording started — speak now");
    } catch (err) {
      console.error("Failed to start clone recording:", err);
      toast.error("Could not access microphone: " + err.message);
    }
  };

  const stopCloneRecording = () => {
    try {
      if (cloneMediaRecorderRef.current && cloneRecording) {
        cloneMediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.error("Failed to stop clone recording:", err);
      setCloneRecording(false);
    }
  };

  const playCloneFile = (index) => {
    const f = cloneFiles && cloneFiles[index];
    if (!f) return;

    if (playingAudioRef.current) {
      try {
        playingAudioRef.current.pause();
        playingAudioRef.current = null;
      } catch (e) {}
      return;
    }

    try {
      const url = URL.createObjectURL(f);
      const a = new Audio(url);
      playingAudioRef.current = a;
      a.onended = () => {
        URL.revokeObjectURL(url);
        playingAudioRef.current = null;
      };
      a.play().catch(() => {});
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  const removeCloneFile = (index) => {
    setCloneFiles((prev) => (prev || []).filter((_, i) => i !== index));
  };

  // Generate video using the created ElevenLabs audio
  const handleGenerateVideoWithAudio = async (audioUrl) => {
    if (!selectedAvatar) {
      throw new Error("Please select an avatar first.");
    }

    setGenerating(true);
    setGenError("");
    setGeneratedVideoUrl("");
    setGenerationStatus("Sending to Video Generator...");

    try {
      let finalBackground = { type: "color", value: bgColor };
      if (bgType === "image" && bgUrl.trim()) {
        finalBackground = { type: "image", url: bgUrl.trim() };
      } else if (bgType === "none") {
        finalBackground = { type: "transparent" };
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/video-generator/generate`,
        {
          avatar_id: selectedAvatar.avatar_id,
          avatar_type: selectedAvatar.type || "avatar",
          avatar_style: avatarStyle,
          voice_id: selectedElevenLabsVoice?.voice_id,
          scriptText: scriptText,
          topic: topic || "Synapse AI Video",
          width: selectedSize.w,
          height: selectedSize.h,
          background_color: bgColor,
          background: finalBackground,
          speed,
          pitch,
          voice_type: "audio",
          audio_url: audioUrl,
        },
      );

      const videoId = res.data?.data?.video_id;
      if (!videoId)
        throw new Error("No video ID returned from Video Generator.");

      setGeneratedVideoId(videoId);
      setGenerationStatus("Video queued — rendering in progress...");

      const videoUrl = await pollStatus(videoId);

      // AUTO-SAVE to Supabase
      try {
        await saveVideo({
          video_id: videoId,
          video_url: videoUrl,
          topic: topic || "Synapse AI Video",
          platform: selectedPlatform.id,
          ratio: selectedSize.label.split(" ")[0],
          tone: "Professional",
          cta: "",
          language: selectedElevenLabsVoice?.language || "English",
        });
        console.log("Video saved to Supabase successfully.");
      } catch (saveErr) {
        console.warn("Failed to auto-save to Supabase:", saveErr.message);
      }

      setGeneratedVideoUrl(videoUrl);
      setGenerationStatus("Done!");
      return videoUrl;
    } catch (err) {
      setGenError(
        err.response?.data?.message ||
          err.message ||
          "Video generation failed.",
      );
      setGenerationStatus("");
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  const toggleElevenLabsAudio = () => {
    if (!elevenLabsAudioRef.current) return;

    if (playingElevenLabsAudio) {
      elevenLabsAudioRef.current.pause();
      setPlayingElevenLabsAudio(false);
    } else {
      elevenLabsAudioRef.current.play().catch(() => {});
      setPlayingElevenLabsAudio(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (elevenLabsAudioRef.current) {
      setAudioCurrentTime(elevenLabsAudioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (elevenLabsAudioRef.current) {
      setAudioDuration(elevenLabsAudioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setPlayingElevenLabsAudio(false);
    setAudioCurrentTime(0);
  };

  const handleAudioSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (elevenLabsAudioRef.current) {
      elevenLabsAudioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const toggleVoicePreview = (voice) => {
    if (!voice.preview_url) return;

    if (voicePreviewRef.current && previewingVoiceId === voice.voice_id) {
      // Stop playing current preview
      voicePreviewRef.current.pause();
      voicePreviewRef.current.currentTime = 0;
      setPreviewingVoiceId(null);
    } else {
      // Play new preview
      if (voicePreviewRef.current && previewingVoiceId) {
        voicePreviewRef.current.pause();
      }
      voicePreviewRef.current = new Audio(voice.preview_url);
      voicePreviewRef.current.onended = () => setPreviewingVoiceId(null);
      voicePreviewRef.current.play().catch(() => {});
      setPreviewingVoiceId(voice.voice_id);
    }
  };

  // Poll video status
  const pollStatus = useCallback(async (videoId) => {
    const maxAttempts = 60;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, 15000));
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/video-generator/status?video_id=${videoId}`,
        );
        const status = res.data?.data?.status;
        if (status === "completed") {
          return res.data?.data?.video_url || "";
        }
        if (status === "failed") {
          throw new Error("Video Generator reported video generation failed.");
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
    setGenerationStatus("Sending to Video Generator...");

    const generateProcess = async () => {
      let finalBackground = { type: "color", value: bgColor };
      if (bgType === "image" && bgUrl.trim()) {
        finalBackground = { type: "image", url: bgUrl.trim() };
      } else if (bgType === "none") {
        finalBackground = { type: "transparent" };
      }

      const res = await axios.post(
        `${API_BASE_URL}/api/video-generator/generate`,
        {
          avatar_id: selectedAvatar.avatar_id,
          avatar_type: selectedAvatar.type || "avatar",
          avatar_style: avatarStyle,
          voice_id: selectedVoice?.voice_id,
          scriptText: scriptText || topic,
          topic: topic || "Synapse AI Video",
          width: selectedSize.w,
          height: selectedSize.h,
          background_color: bgColor,
          background: finalBackground,
          speed,
          pitch,
          voice_type: generatedAudioUrl ? "audio" : "text",
          audio_url: generatedAudioUrl,
        },
      );

      const videoId = res.data?.data?.video_id;
      if (!videoId)
        throw new Error("No video ID returned from Video Generator.");

      setGeneratedVideoId(videoId);
      setGenerationStatus("Video queued — rendering in progress...");

      const videoUrl = await pollStatus(videoId);

      // AUTO-SAVE to Supabase
      try {
        await saveVideo({
          video_id: videoId,
          video_url: videoUrl,
          topic: topic || "Synapse AI Video",
          platform: selectedPlatform.id, // Save ID instead of label for icon matching
          ratio: selectedSize.label.split(" ")[0],
          tone: "Professional",
          cta: "",
          language: voiceLang || "English",
        });
        console.log("Video saved to Supabase successfully.");
      } catch (saveErr) {
        console.warn("Failed to auto-save to Supabase:", saveErr.message);
      }
      return videoUrl;
    };

    const promise = generateProcess();

    toast.promise(
      promise,
      {
        loading: "Video rendering in background (3-15 min)...",
        success: "Video generation complete!",
        error: (err) => `Generation failed: ${err.message}`,
      },
      {
        style: {
          background: "rgba(20, 20, 30, 0.9)",
          color: "#fff",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        success: { duration: 6000 },
        error: { duration: 6000 },
      },
    );

    try {
      const url = await promise;
      setGeneratedVideoUrl(url);
      setGenerationStatus("Done!");
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
              Video Generator
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
              onClick={() => setActiveTab("elevenlabs")}
              className={tabClass("elevenlabs")}
            >
              <span className="flex items-center gap-2">
                <Sparkles size={14} /> ElevenLabs
                {generatedAudioUrl && (
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
                    onChange={(e) => {
                      setAvatarSearch(e.target.value);
                      setAvatarPage(1);
                    }}
                    className="w-full bg-white/10 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-1">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        setAvatarGender(g);
                        setAvatarPage(1);
                      }}
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
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-4 2xl:grid-cols-6 gap-2 max-h-[440px] overflow-y-auto pr-1">
                    {paginatedAvatars.map((avatar) => (
                      <AvatarCard
                        key={avatar.avatar_id}
                        avatar={avatar}
                        selected={
                          selectedAvatar?.avatar_id === avatar.avatar_id
                        }
                        onSelect={setSelectedAvatar}
                      />
                    ))}
                    {filteredAvatars.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-400 text-sm">
                        No avatars match your search
                      </div>
                    )}
                  </div>
                  {totalAvatarPages > 1 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                      <span className="text-xs text-gray-400">
                        Page {avatarPage} of {totalAvatarPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setAvatarPage((p) => Math.max(1, p - 1))
                          }
                          disabled={avatarPage === 1}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setAvatarPage((p) =>
                              Math.min(totalAvatarPages, p + 1),
                            )
                          }
                          disabled={avatarPage === totalAvatarPages}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ELEVENLABS TAB ── */}
          {activeTab === "elevenlabs" && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-400" />
                  ElevenLabs Text-to-Audio
                </h2>
              </div>

              {elevenLabsError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-xl flex items-start gap-2 text-red-300 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">ElevenLabs Error</p>
                    <p className="text-xs mt-1">{elevenLabsError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                      Select Voice
                    </label>

                    {/* Search Input */}
                    <div className="relative mb-3">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Search voices..."
                        value={elevenLabsVoiceSearch}
                        onChange={(e) =>
                          setElevenLabsVoiceSearch(e.target.value)
                        }
                        className="w-full bg-white/10 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {/* Voices List */}
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {loadingElevenLabs ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="animate-spin text-purple-400" />
                        </div>
                      ) : (
                        (elevenLabsVoices || [])
                          .filter(
                            (voice) =>
                              !elevenLabsVoiceSearch ||
                              voice.name
                                .toLowerCase()
                                .includes(elevenLabsVoiceSearch.toLowerCase()),
                          )
                          .map((voice) => (
                            <div
                              key={voice.voice_id}
                              className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${selectedElevenLabsVoice?.voice_id === voice.voice_id ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                            >
                              {/* Play Button */}
                              <button
                                onClick={() => toggleVoicePreview(voice)}
                                disabled={!voice.preview_url}
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                  voice.preview_url
                                    ? previewingVoiceId === voice.voice_id
                                      ? "bg-purple-600 text-white"
                                      : "bg-white/10 text-gray-400 hover:bg-purple-600 hover:text-white"
                                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                                }`}
                              >
                                {previewingVoiceId === voice.voice_id ? (
                                  <Pause size={14} />
                                ) : (
                                  <Play size={14} />
                                )}
                              </button>

                              {/* Voice Info */}
                              <div
                                onClick={() =>
                                  setSelectedElevenLabsVoice(voice)
                                }
                                className="flex-1 min-w-0"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-white truncate">
                                    {voice.name}
                                  </span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {voice.tag && (
                                      <span className="text-[10px] px-2 py-0.5 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 border border-purple-400/30 rounded-full font-semibold text-purple-300 whitespace-nowrap">
                                        {voice.tag}
                                      </span>
                                    )}
                                    {selectedElevenLabsVoice?.voice_id ===
                                      voice.voice_id && (
                                      <CheckCircle2
                                        size={14}
                                        className="text-emerald-400 flex-shrink-0"
                                      />
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                                  <span>{voice.accent || "Standard"}</span>
                                  <span>•</span>
                                  <span>{voice.category || "General"}</span>
                                  {voice.language &&
                                    voice.language !== "English" && (
                                      <>
                                        <span>•</span>
                                        <span>{voice.language}</span>
                                      </>
                                    )}
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                      {(elevenLabsVoices || []).filter(
                        (voice) =>
                          !elevenLabsVoiceSearch ||
                          voice.name
                            .toLowerCase()
                            .includes(elevenLabsVoiceSearch.toLowerCase()),
                      ).length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          {elevenLabsVoiceSearch
                            ? "No voices match your search"
                            : "No voices available"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Stability
                      </label>
                      <span className="text-xs text-purple-400">
                        {Math.round(stability * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={stability}
                      onChange={(e) => setStability(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">
                        Similarity Boost
                      </label>
                      <span className="text-xs text-purple-400">
                        {Math.round(similarityBoost * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={similarityBoost}
                      onChange={(e) =>
                        setSimilarityBoost(parseFloat(e.target.value))
                      }
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleGenerateElevenLabsAudio}
                      disabled={generatingAudio || !scriptText.trim()}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {generatingAudio ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Volume2 size={18} />
                      )}
                      {generatingAudio
                        ? "Generating Audio..."
                        : "Generate Audio"}
                    </button>
                  </div>

                  {/* ElevenLabs: Clone voice UI */}
                  <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-2">
                      Create Cloned Voice
                    </label>

                    <input
                      type="text"
                      placeholder="Name for cloned voice (e.g. 'Marketing_Fred')"
                      value={cloneName}
                      onChange={(e) => setCloneName(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />

                    {/* Recording controls */}
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() =>
                          cloneRecording
                            ? stopCloneRecording()
                            : startCloneRecording()
                        }
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${cloneRecording ? "bg-red-600 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"}`}
                      >
                        {cloneRecording ? (
                          <MicOff size={14} />
                        ) : (
                          <Mic size={14} />
                        )}
                        {cloneRecording ? "Stop" : "Record"}
                      </button>

                      <button
                        onClick={() => {
                          // clear recordings and selected files
                          setCloneFiles([]);
                          if (fileInputRef.current)
                            fileInputRef.current.value = null;
                        }}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-white/5 text-gray-300 hover:bg-white/10"
                      >
                        Clear Samples
                      </button>
                    </div>

                    <div className="mt-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        multiple
                        onChange={handleCloneFilesChange}
                        className="w-full text-sm text-gray-300"
                      />
                    </div>

                    {cloneFiles && cloneFiles.length > 0 && (
                      <div className="mt-2 text-xs text-gray-300 space-y-2">
                        {cloneFiles.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <button
                                onClick={() => playCloneFile(i)}
                                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:bg-white/10"
                                title="Play sample"
                              >
                                <Play size={12} />
                              </button>
                              <span className="truncate">{f.name}</span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-[10px] text-gray-400">
                                {Math.round((f.size || 0) / 1024)} KB
                              </span>
                              <button
                                onClick={() => removeCloneFile(i)}
                                className="text-gray-400 hover:text-white"
                                title="Remove sample"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3">
                      <button
                        onClick={handleCreateClone}
                        disabled={
                          cloning ||
                          !cloneName.trim() ||
                          cloneFiles.length === 0 ||
                          cloneFiles.length > 25
                        }
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-2 rounded-xl shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {cloning ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                        {cloning ? "Creating Clone..." : "Create Cloned Voice"}
                      </button>
                    </div>

                    {cloneFiles.length > 0 && !cloneName.trim() && (
                      <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1">
                        <AlertCircle size={10} /> Please provide a name for your voice clone.
                      </p>
                    )}

                    {cloneFiles.length > 25 && (
                      <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                        <AlertCircle size={10} /> Maximum 25 samples allowed for voice cloning.
                      </p>
                    )}

                    {cloneError && (
                      <p className="text-xs text-red-400 mt-2">{cloneError}</p>
                    )}

                    <p className="text-[10px] text-gray-400 mt-2">
                      Note: ElevenLabs cloning requires a Pro subscription and
                      valid audio samples (1-25 files).
                    </p>
                  </div>

                  {generatedAudioUrl && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                        <CheckCircle2 size={16} /> Generated Audio Preview
                      </h3>

                      {/* Audio Element (hidden) */}
                      <audio
                        ref={elevenLabsAudioRef}
                        src={generatedAudioUrl}
                        onTimeUpdate={handleAudioTimeUpdate}
                        onLoadedMetadata={handleAudioLoadedMetadata}
                        onEnded={handleAudioEnded}
                        className="hidden"
                      />

                      {/* Audio Card */}
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-black/30 border border-emerald-500/30">
                        {/* Play Button */}
                        <button
                          onClick={toggleElevenLabsAudio}
                          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            playingElevenLabsAudio
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white"
                          }`}
                        >
                          {playingElevenLabsAudio ? (
                            <Pause size={20} />
                          ) : (
                            <Play size={20} />
                          )}
                        </button>

                        {/* Progress Section */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">
                              {selectedElevenLabsVoice?.name ||
                                "Generated Audio"}
                            </span>
                            <span className="text-xs text-emerald-300 font-medium">
                              {formatTime(audioCurrentTime)} /{" "}
                              {formatTime(audioDuration)}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <input
                            type="range"
                            min="0"
                            max={audioDuration || 0}
                            value={audioCurrentTime}
                            onChange={handleAudioSeek}
                            className="w-full h-2 bg-emerald-900/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />

                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gray-400">
                              ElevenLabs TTS
                            </p>
                            <p className="text-[10px] text-emerald-300 font-medium">
                              {playingElevenLabsAudio ? "Playing..." : "Ready"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
                    onChange={(e) => {
                      setVoiceSearch(e.target.value);
                      setVoicePage(1);
                    }}
                    className="w-full bg-white/10 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <select
                  value={voiceLang}
                  onChange={(e) => {
                    setVoiceLang(e.target.value);
                    setVoicePage(1);
                  }}
                  className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l} className="text-black bg-white">
                      {l}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        setVoiceGender(g);
                        setVoicePage(1);
                      }}
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

              {loadingVoices ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-purple-400" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {paginatedVoices.map((voice) => (
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
                  {totalVoicePages > 1 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                      <span className="text-xs text-gray-400">
                        Page {voicePage} of {totalVoicePages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setVoicePage((p) => Math.max(1, p - 1))
                          }
                          disabled={voicePage === 1}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setVoicePage((p) =>
                              Math.min(totalVoicePages, p + 1),
                            )
                          }
                          disabled={voicePage === totalVoicePages}
                          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                        >
                          Next
                        </button>
                      </div>
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

              {/* Background Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">Background</label>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                    <button
                      onClick={() => setBgType("color")}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${
                        bgType === "color"
                          ? "bg-purple-600 text-white shadow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Color
                    </button>
                    <button
                      onClick={() => setBgType("none")}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${
                        bgType === "none"
                          ? "bg-purple-600 text-white shadow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      None
                    </button>
                    <button
                      onClick={() => setBgType("image")}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${
                        bgType === "image" || bgType === "upload"
                          ? "bg-purple-600 text-white shadow"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Image
                    </button>
                  </div>
                </div>

                {bgType === "color" && (
                  <>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {BG_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setBgColor(p.value)}
                          className={`p-2 rounded-lg text-xs text-center border transition-all ${
                            bgColor === p.value
                              ? "border-purple-500"
                              : "border-white/10 bg-white/5 hover:border-white/30"
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
                  </>
                )}

                {bgType === "none" && (
                  <div className="text-xs text-gray-400 py-4 text-center border border-dashed border-white/20 rounded-lg bg-black/50">
                    Video will be generated with a transparent background.
                  </div>
                )}

                {(bgType === "image" || bgType === "upload") && (
                  <div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            if (!e.target.files?.[0]) return;
                            try {
                              setUploadingBg(true);
                              const { url } = await uploadImage(
                                e.target.files[0],
                              );
                              setBgUrl(url);
                              toast.success("Background uploaded and linked.");
                            } catch (error) {
                              toast.error("Failed to upload image.");
                            } finally {
                              setUploadingBg(false);
                            }
                          }}
                          className="block w-full text-sm text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-purple-600 file:text-white
                            hover:file:bg-purple-500 cursor-pointer"
                        />
                        {uploadingBg && (
                          <Loader2
                            size={16}
                            className="animate-spin text-purple-400 flex-shrink-0"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 font-medium">
                          OR paste URL:
                        </span>
                        <input
                          type="text"
                          value={bgUrl}
                          onChange={(e) => setBgUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 min-w-0 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    {bgUrl && (
                      <div className="mt-3 w-full h-24 rounded-lg bg-black border border-white/10 overflow-hidden relative">
                        <img
                          src={bgUrl}
                          alt="Background preview"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      </div>
                    )}
                  </div>
                )}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs text-gray-400">
                  Script Text
                  <span className="ml-2 text-gray-500">
                    ({(scriptText || "").split(/\s+/).filter(Boolean).length}{" "}
                    words)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                      isRecording
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    {isRecording ? <MicOff size={10} /> : <Mic size={10} />}
                    {isRecording ? "Stop Recording" : "Record Audio"}
                  </button>
                  {voiceLang && voiceLang !== "All" && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 text-[10px] uppercase font-bold tracking-wider">
                      {voiceLang} Script
                    </span>
                  )}
                </div>
              </div>
              <textarea
                value={scriptText}
                onChange={(e) => setScriptText(e.target.value)}
                rows={6}
                placeholder="Type or generate your video script here... For best results keep it under 150 words."
                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>

          {/* Generate Audio or Video Button */}
          {!generatedAudioUrl ? (
            <button
              onClick={handleGenerateElevenLabsAudio}
              disabled={
                generatingAudio ||
                !selectedElevenLabsVoice ||
                !scriptText.trim()
              }
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/30"
            >
              {generatingAudio ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating Audio...
                </>
              ) : (
                <>
                  <Volume2 size={18} />
                  Generate Audio with ElevenLabs
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-green-900/30 border border-green-500/30 rounded-xl flex items-start gap-2 text-green-300 text-sm">
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                <span>
                  Audio generated!{" "}
                  {!generating &&
                    !generatedVideoUrl &&
                    "Click below to create your video."}
                </span>
              </div>
              {!generatedVideoUrl && (
                <button
                  onClick={() => {
                    if (selectedAvatar) {
                      const generatePromise =
                        handleGenerateVideoWithAudio(generatedAudioUrl);
                      toast.promise(
                        generatePromise,
                        {
                          loading: "Generating video with your audio...",
                          success: "Video generation started!",
                          error: (err) =>
                            `Failed to generate video: ${err.message}`,
                        },
                        {
                          style: {
                            background: "rgba(20, 20, 30, 0.9)",
                            color: "#fff",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                          },
                          success: { duration: 4000 },
                          error: { duration: 6000 },
                        },
                      );
                      generatePromise.catch(() => {});
                    } else {
                      toast.error("Please select an avatar first");
                    }
                  }}
                  disabled={generating || !selectedAvatar}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {generationStatus || "Generating..."}
                    </>
                  ) : (
                    <>
                      <Video size={16} />
                      Create Video with This Audio
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Generate Video Button (for text-to-speech fallback) */}
          {!generatedAudioUrl && (
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
          )}

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
                Video Generator renders in the cloud — this typically takes 3–15
                minutes depending on length.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
