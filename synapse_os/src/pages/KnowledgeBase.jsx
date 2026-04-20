import React, { useState, useEffect, useCallback, useRef } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Tabs from "../components/ui/Tabs";
import { API_BASE_URL } from "../config/apiConfig";
import {
  Upload,
  FileText,
  Link as LinkIcon,
  BookOpen,
  Trash2,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  Image,
  Globe,
  Sparkles,
  User,
  Search,
  Eye,
  Zap,
  Brain,
  PenTool,
  Video,
  MessageSquare,
  LayoutGrid,
  ArrowRight,
  ExternalLink,
  Shield,
  Bot,
} from "lucide-react";

// Global cache for Knowledge Base documents
let globalDocsCache = null;
let globalCountsCache = null;

// ─── Helper: format file size ────────────────────────────────────────────────
const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Helper: format date ─────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ─── Helper: lightweight markdown renderer ──────────────────────────────────
const MarkdownText = ({ text }) => {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  let listBuffer = [];
  let listType = null;

  const flushList = (key) => {
    if (listBuffer.length === 0) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    elements.push(
      <Tag
        key={`list-${key}`}
        className={
          listType === "ol"
            ? "list-decimal list-inside space-y-1 my-2"
            : "list-disc list-inside space-y-1 my-2"
        }
      >
        {listBuffer.map((item, j) => (
          <li
            key={j}
            className="text-slate-300"
            dangerouslySetInnerHTML={{ __html: item }}
          />
        ))}
      </Tag>,
    );
    listBuffer = [];
    listType = null;
  };

  const renderInline = (str) =>
    str
      .replace(
        /\*\*(.+?)\*\*/g,
        "<strong class='text-white font-semibold'>$1</strong>",
      )
      .replace(/\*(.+?)\*/g, "<em class='italic text-slate-300'>$1</em>")
      .replace(
        /`(.+?)`/g,
        "<code class='bg-slate-700 text-cyan-300 px-1 rounded text-xs font-mono'>$1</code>",
      );

  while (i < lines.length) {
    const line = lines[i];
    if (/^### (.+)/.test(line)) {
      flushList(i);
      elements.push(
        <h4
          key={i}
          className="text-white font-semibold text-sm mt-3 mb-1"
          dangerouslySetInnerHTML={{
            __html: renderInline(line.replace(/^### /, "")),
          }}
        />,
      );
    } else if (/^## (.+)/.test(line)) {
      flushList(i);
      elements.push(
        <h3
          key={i}
          className="text-white font-bold text-sm mt-4 mb-1 border-b border-slate-700 pb-1"
          dangerouslySetInnerHTML={{
            __html: renderInline(line.replace(/^## /, "")),
          }}
        />,
      );
    } else if (/^# (.+)/.test(line)) {
      flushList(i);
      elements.push(
        <h2
          key={i}
          className="text-white font-bold text-base mt-4 mb-2"
          dangerouslySetInnerHTML={{
            __html: renderInline(line.replace(/^# /, "")),
          }}
        />,
      );
    } else if (/^\d+\.\s(.+)/.test(line)) {
      if (listType !== "ol") {
        flushList(i);
        listType = "ol";
      }
      listBuffer.push(renderInline(line.replace(/^\d+\.\s/, "")));
    } else if (/^[-*]\s(.+)/.test(line)) {
      if (listType !== "ul") {
        flushList(i);
        listType = "ul";
      }
      listBuffer.push(renderInline(line.replace(/^[-*]\s/, "")));
    } else if (line.trim() === "") {
      flushList(i);
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      flushList(i);
      elements.push(
        <p
          key={i}
          className="text-slate-200 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }}
        />,
      );
    }
    i++;
  }
  flushList("end");
  return <div className="text-sm space-y-0.5">{elements}</div>;
};

// ─── Helper: file type icon ─────────────────────────────────────────────────

const FileIcon = ({ format, className = "" }) => {
  const iconMap = {
    pdf: <FileText className={`text-red-400 ${className}`} />,
    docx: <FileText className={`text-blue-400 ${className}`} />,
    txt: <FileText className={`text-slate-400 ${className}`} />,
    md: <FileText className={`text-emerald-400 ${className}`} />,
    image: <Image className={`text-pink-400 ${className}`} />,
    url: <Globe className={`text-cyan-400 ${className}`} />,
  };
  return iconMap[format] || <File className={`text-slate-400 ${className}`} />;
};

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle size={12} /> Active
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Loader2 size={12} className="animate-spin" /> Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
      <AlertCircle size={12} /> Failed
    </span>
  );
};

// ─── Add Link Modal ──────────────────────────────────────────────────────────
const AddLinkModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkType, setLinkType] = useState("link");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ url, title, description, file_type: linkType });
    setUrl("");
    setTitle("");
    setDescription("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden">
        {/* Modal header gradient */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 rounded-xl">
                <LinkIcon size={20} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Add Link</h3>
                <p className="text-xs text-slate-400">
                  Add a URL to your knowledge base
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                URL *
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                required
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this link a name"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this link about?"
                rows={3}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Type
              </label>
              <div className="flex gap-2">
                {[
                  { id: "link", label: "Link" },
                  { id: "guideline", label: "Guideline" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setLinkType(t.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      linkType === t.id
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                disabled={!url}
              >
                <Plus size={16} /> Add Link
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Workflow Step Card ──────────────────────────────────────────────────────
const WorkflowStep = ({ number, title, description, icon: Icon, isActive }) => (
  <div
    className={`relative flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-500 group ${
      isActive
        ? "bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10"
        : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600"
    }`}
  >
    <div
      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all ${
        isActive
          ? "bg-purple-500/20 text-purple-400"
          : "bg-slate-700/50 text-slate-400 group-hover:text-slate-300"
      }`}
    >
      <Icon size={24} />
    </div>
    <span
      className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
        isActive ? "text-purple-400" : "text-slate-500"
      }`}
    >
      Step {number}
    </span>
    <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
    <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
  </div>
);

// ─── Content Example Card ────────────────────────────────────────────────────
const ContentExample = ({ icon: Icon, title, description, color }) => (
  <div className="group relative p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:shadow-lg">
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}
    >
      <Icon size={18} />
    </div>
    <h4 className="text-sm font-semibold text-white mb-1.5">{title}</h4>
    <p className="text-xs text-slate-400 leading-relaxed italic">
      "{description}"
    </p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const KnowledgeBase = () => {
  const [items, setItems] = useState(globalDocsCache || []);
  const [counts, setCounts] = useState(
    globalCountsCache || {
      documents: 0,
      links: 0,
      guidelines: 0,
    },
  );
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(!globalDocsCache);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);
  const chatScrollRef = useRef(null);

  // Chatbot states
  const [chatQuery, setChatQuery] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  // ─── Fetch items ───────────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    try {
      if (!globalDocsCache) setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/knowledge-base`);
      const data = await res.json();

      globalDocsCache = data.items || [];
      globalCountsCache = data.counts || {
        documents: 0,
        links: 0,
        guidelines: 0,
      };

      setItems(globalDocsCache);
      setCounts(globalCountsCache);
    } catch (err) {
      console.error("Error fetching knowledge base:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    // Poll for status updates every 10s
    const interval = setInterval(fetchItems, 10000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  // ─── Upload file ───────────────────────────────────────────────────────────
  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;

    // Filter for PDFs
    const validFiles = Array.from(files).filter(
      (f) =>
        f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf",
    );

    if (validFiles.length === 0) {
      alert("Only PDF files are supported");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);

    try {
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("file_type", "document");

        const res = await fetch(`${API_BASE_URL}/api/knowledge-base/upload`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.error) {
          console.error("Upload error:", data.error);
        }
      }
      await fetchItems();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ─── Add link ──────────────────────────────────────────────────────────────
  const handleAddLink = async (linkData) => {
    setIsAddingLink(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge-base/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linkData),
      });
      const data = await res.json();
      if (data.error) {
        console.error("Link error:", data.error);
      } else {
        setShowLinkModal(false);
        await fetchItems();
      }
    } catch (err) {
      console.error("Add link failed:", err);
    } finally {
      setIsAddingLink(false);
    }
  };

  // ─── Delete item ───────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await fetch(`${API_BASE_URL}/api/knowledge-base/${id}`, {
        method: "DELETE",
      });
      await fetchItems();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Drag/Drop handlers ────────────────────────────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  // ─── Chatbot handler ───────────────────────────────────────────────────────
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatQuery.trim() || isChatLoading) return;

    const userMsg = { role: "user", content: chatQuery };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatQuery("");
    setIsChatLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/knowledge-base/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });
      const data = await res.json();

      if (data.error) {
        setChatMessages((prev) => [
          ...prev,
          { role: "system", content: "Error: " + data.error },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        { role: "system", content: "Connection error." },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ─── Filter items by tab ───────────────────────────────────────────────────
  const filteredItems =
    activeTab === "all"
      ? items
      : items.filter((item) => item.file_type === activeTab);

  return (
    <div className="space-y-8">
      {/* ═══ HEADER ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/40 via-slate-900 to-cyan-900/30 border border-purple-500/20 p-8">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500/30 to-purple-600/10 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10">
              <BookOpen size={28} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Client Knowledge Hub
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Upload content sources for fully personalized AI generation
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <FileText size={16} className="text-purple-400" />
              <span className="text-sm font-medium text-white">
                {counts.documents}
              </span>
              <span className="text-xs text-slate-400">Documents</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <LinkIcon size={16} className="text-cyan-400" />
              <span className="text-sm font-medium text-white">
                {counts.links}
              </span>
              <span className="text-xs text-slate-400">Links</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <Shield size={16} className="text-emerald-400" />
              <span className="text-sm font-medium text-white">
                {counts.guidelines}
              </span>
              <span className="text-xs text-slate-400">Guidelines</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ UPLOAD ZONE ═══ */}
      <Card className="relative overflow-hidden">
        {/* Gradient top border */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Upload size={20} className="text-purple-400" /> Upload Content
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add sources for AI personalization
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowLinkModal(true)}
          >
            <LinkIcon size={14} /> Add Link
          </Button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 group ${
            isDragging
              ? "border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10"
              : "border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/30"
          }`}
        >
          {/* Animated corner accents */}
          <div
            className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-xl transition-colors duration-300 ${
              isDragging ? "border-purple-500" : "border-slate-600"
            }`}
          />
          <div
            className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-xl transition-colors duration-300 ${
              isDragging ? "border-purple-500" : "border-slate-600"
            }`}
          />
          <div
            className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-xl transition-colors duration-300 ${
              isDragging ? "border-purple-500" : "border-slate-600"
            }`}
          />
          <div
            className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-xl transition-colors duration-300 ${
              isDragging ? "border-purple-500" : "border-slate-600"
            }`}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf"
            className="hidden"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleUpload(e.target.files)}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={40} className="text-purple-400 animate-spin" />
              <p className="text-sm text-purple-400 font-medium">
                Uploading & processing...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div
                className={`p-4 rounded-2xl transition-all duration-300 ${
                  isDragging
                    ? "bg-purple-500/20 scale-110"
                    : "bg-slate-800/50 group-hover:bg-purple-500/10 group-hover:scale-105"
                }`}
              >
                <Upload
                  size={32}
                  className={`transition-colors duration-300 ${
                    isDragging
                      ? "text-purple-400"
                      : "text-slate-500 group-hover:text-purple-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Drop files here or{" "}
                  <span className="text-purple-400 underline underline-offset-2">
                    click to upload
                  </span>
                </p>
                <p className="text-xs text-slate-500 mt-1.5">
                  Support for PDF files
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Supported formats strip */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
            Supported:
          </span>
          {["PDF", "URLs"].map((fmt) => (
            <span
              key={fmt}
              className="px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/50 text-[10px] text-slate-400 font-medium"
            >
              {fmt}
            </span>
          ))}
        </div>
      </Card>

      {/* ═══ DOCUMENTS LIST ═══ */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <h3 className="text-lg font-semibold text-white">
            Knowledge Base
            <span className="text-sm text-slate-400 font-normal ml-2">
              {items.length} items
            </span>
          </h3>
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: "all", label: "All" },
              { id: "document", label: "Documents" },
              { id: "link", label: "Links" },
              { id: "guideline", label: "Guidelines" },
            ]}
          />
        </div>

        {isLoading ? (
          <Card className="flex items-center justify-center py-16">
            <Loader2 size={32} className="text-purple-400 animate-spin" />
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-slate-800/50 mb-4">
              <BookOpen size={32} className="text-slate-500" />
            </div>
            <h4 className="text-sm font-medium text-slate-300 mb-1">
              No items yet
            </h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Upload documents, add links, or create guidelines to build your
              knowledge base for personalized AI content.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="flex items-center gap-4 p-4 hover:border-slate-600 transition-all duration-200 group"
              >
                {/* File icon */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 shrink-0">
                  <FileIcon format={item.file_format} className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white truncate">
                      {item.file_name}
                    </h4>
                    {item.file_format && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-bold shrink-0">
                        {item.file_format}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">
                      {formatSize(item.file_size)}
                    </span>
                    <span className="text-slate-700">•</span>
                    <span className="text-xs text-slate-500">
                      {formatDate(item.created_at)}
                    </span>
                    {item.description && (
                      <>
                        <span className="text-slate-700">•</span>
                        <span className="text-xs text-slate-500 truncate max-w-[200px]">
                          {item.description}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={item.status} />

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-cyan-400 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {deletingId === item.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ═══ AI CONTENT GENERATION WORKFLOW ═══ */}
      <div className="mt-4">
        <Card className="relative overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-cyan-500/20">
                <Sparkles size={20} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  AI Content Generation Workflow
                </h3>
                <p className="text-xs text-slate-400">
                  Four-step process for personalized content creation
                </p>
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <WorkflowStep
                number={1}
                title="Profile Analysis"
                description="AI analyzes client profile, audience, focus areas, and content goals"
                icon={User}
                isActive={false}
              />
              <WorkflowStep
                number={2}
                title="Inspiration Scan"
                description="Scans competitor profiles to identify trending topics and engagement patterns"
                icon={Search}
                isActive={false}
              />
              <WorkflowStep
                number={3}
                title="Knowledge Hub"
                description="Reads uploaded documents, guidelines, and expertise to personalize content"
                icon={Brain}
                isActive={true}
              />
              <WorkflowStep
                number={4}
                title="AI Generation"
                description="Generates personalized content adapted to your unique voice and style"
                icon={Zap}
                isActive={false}
              />
            </div>

            {/* Connecting arrows for lg screens */}
            <div className="hidden lg:flex items-center justify-between px-[25%] -mt-[72px] mb-8 pointer-events-none">
              <ArrowRight size={20} className="text-slate-600" />
              <ArrowRight size={20} className="text-slate-600" />
              <ArrowRight size={20} className="text-slate-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* ═══ CONTENT OUTPUT EXAMPLES ═══ */}
      <Card>
        <h3 className="text-lg font-semibold text-white mb-1">
          Content Output Examples
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Personalized content generated from your knowledge base
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ContentExample
            icon={MessageSquare}
            title="Captions"
            description="Leadership isn't about authority—it's about inspiring others to reach their potential. 💫"
            color="bg-purple-500/10 text-purple-400"
          />
          <ContentExample
            icon={Video}
            title="Scripts"
            description="Video scripts with personalized storytelling based on your expertise"
            color="bg-cyan-500/10 text-cyan-400"
          />
          <ContentExample
            icon={PenTool}
            title="Reels"
            description="Short-form video content with your unique voice and message"
            color="bg-pink-500/10 text-pink-400"
          />
          <ContentExample
            icon={LayoutGrid}
            title="Educational Posts"
            description="Carousel posts tailored to your teaching style and methodology"
            color="bg-emerald-500/10 text-emerald-400"
          />
        </div>
      </Card>

      {/* ═══ PURPOSE BANNER ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/20 via-slate-900/80 to-cyan-900/20 border border-slate-700/50 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(34,211,238,0.06),transparent_50%)]" />

        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 shrink-0">
            <Sparkles size={22} className="text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-1">
              Purpose of the Knowledge Hub
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Allow the AI to access your knowledge base and create fully
              personalized content tailored to your brand voice and expertise.
              Upload documents, guidelines, and links to train the AI on your
              unique perspective.
            </p>
          </div>
        </div>
      </div>

      {/* ═══ KNOWLEDGE BASE CHATBOT ═══ */}
      <Card className="relative overflow-hidden border-cyan-500/30">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

        <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <MessageSquare size={20} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Test Knowledge RAG
              </h3>
              <p className="text-xs text-slate-400">
                Ask questions to verify AI is fetching from your documents.
              </p>
            </div>
          </div>
          <Badge color="cyan" text="Testing Tool" icon={Zap} />
        </div>

        <div
          ref={chatScrollRef}
          className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-900/50"
        >
          {chatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Bot size={32} className="mb-2 opacity-50" />
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs mt-1">
                Ask something based on the uploaded PDFs!
              </p>
            </div>
          ) : (
            chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-none"
                      : msg.role === "system"
                        ? "bg-red-500/20 border border-red-500/30 text-red-300 rounded-bl-none"
                        : "bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <MarkdownText text={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))
          )}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                <Loader2 size={14} className="text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-400">Thinking...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-800/30 border-t border-slate-700/50">
          <form onSubmit={handleChatSubmit} className="flex items-center gap-3">
            <input
              type="text"
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              placeholder="Ask anything about your documents..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm"
              disabled={isChatLoading}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isChatLoading || !chatQuery.trim()}
            >
              Send
            </Button>
          </form>
        </div>
      </Card>

      {/* ═══ LINK MODAL ═══ */}
      <AddLinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSubmit={handleAddLink}
        isSubmitting={isAddingLink}
      />
    </div>
  );
};

export default KnowledgeBase;
