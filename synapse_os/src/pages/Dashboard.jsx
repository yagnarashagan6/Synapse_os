import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../config/apiConfig";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import {
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  ArrowRight,
  MoreHorizontal,
  Bot,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Music2,
  Heart,
  Eye,
  MessageCircle,
  X,
  Calendar,
  Lock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import DatePicker from "../components/ui/DatePicker";

// ─── Platform config ───────────────────────────────────────────────────────────
// `sourceKey` matches substring in scrapedData._source to identify platform data
// `available` = false means "Coming Soon" — no data yet

const PLATFORMS = [
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    gradient: "from-yellow-500 via-pink-500 to-purple-600",
    textColor: "#e1306c",
    available: true,
    sourceKey: "instagram", // matches comp.scrapedData._source
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    gradient: "from-blue-600 to-blue-700",
    textColor: "#0a66c2",
    available: true,
    sourceKey: "WI0tj4Ieb5Kq458gB", // matches comp.scrapedData._source for Apify LinkedIn actor
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: Music2,
    gradient: "from-black to-gray-800",
    textColor: "#010101",
    available: false,
    sourceKey: "tiktok",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: Youtube,
    gradient: "from-red-600 to-red-700",
    textColor: "#ff0000",
    available: false,
    sourceKey: "youtube",
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    icon: Twitter,
    gradient: "from-gray-900 to-black",
    textColor: "#1da1f2",
    available: false,
    sourceKey: "twitter",
  },
];

// ─── Metric config ─────────────────────────────────────────────────────────────

const METRIC_CONFIG = {
  likes: {
    label: "Likes",
    icon: Heart,
    color: "#f43f5e",
    field: (p) => Number(p.likesCount || p.likeCount || p.numLikes) || 0,
  },
  views: {
    label: "Views",
    icon: Eye,
    color: "#22d3ee",
    field: (p) =>
      Number(p.videoViewCount || p.videoPlayCount || p.viewCount) || 0,
  },
  comments: {
    label: "Comments",
    icon: MessageCircle,
    color: "#a78bfa",
    field: (p) =>
      Number(p.commentsCount || p.commentCount || p.numComments) || 0,
  },
};

const COMPANY_COLORS = [
  "#8b5cf6",
  "#22d3ee",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
];

// ─── Data helpers ──────────────────────────────────────────────────────────────

function weekBucket(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return null;
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function shortCaption(text, words = 6) {
  if (!text) return "";
  const w = text.trim().split(/\s+/);
  return w.length <= words ? text.trim() : w.slice(0, words).join(" ") + "…";
}

function getDisplayName(name) {
  if (!name) return "Unknown";
  const match = name.match(
    /(?:instagram\.com|twitter\.com|x\.com|tiktok\.com|linkedin\.com\/in)\/([^/?]+)/,
  );
  if (match) return "@" + match[1];
  if (name.startsWith("@")) return name;
  return name;
}

/**
 * Filter competitors to those belonging to the active platform.
 * Instagram: has latestPosts OR _source contains 'instagram'
 * Others:    _source contains the sourceKey (future-ready)
 */
function filterByPlatform(competitors, platformKey) {
  const platform = PLATFORMS.find((p) => p.key === platformKey);
  if (!platform) return [];

  return competitors.filter((comp) => {
    const source = (comp?.scrapedData?._source || "").toLowerCase();
    if (platformKey === "instagram") {
      // Instagram: has latestPosts OR _source contains 'instagram'
      return (
        Array.isArray(comp?.scrapedData?.latestPosts) ||
        source.includes("instagram")
      );
    }
    return source.includes((platform.sourceKey || "").toLowerCase());
  });
}

function buildChartData(competitors, metric, startDate, endDate) {
  const fn = METRIC_CONFIG[metric].field;
  const buckets = {};

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  competitors.forEach((comp) => {
    let posts = comp?.scrapedData?.latestPosts;
    if (!Array.isArray(posts) || posts.length === 0) return;

    // Filter posts by date range if provided
    if (start || end) {
      posts = posts.filter((post) => {
        const ts =
          post.timestamp ||
          post.publishedAt ||
          post.postedAt ||
          post.time ||
          post.date;
        if (!ts) return false;
        const postDate = new Date(ts);
        if (start && postDate < start) return false;
        if (end && postDate > end) return false;
        return true;
      });
    }

    posts.forEach((post) => {
      const ts =
        post.timestamp ||
        post.publishedAt ||
        post.postedAt ||
        post.time ||
        post.date;
      const label = ts ? weekBucket(ts) : null;
      if (!label) return;
      if (!buckets[label]) buckets[label] = { _ts: new Date(ts) };
      const displayName = getDisplayName(comp.name);
      if (!buckets[label][displayName])
        buckets[label][displayName] = { total: 0, topVal: -1, topCap: "" };

      const val = fn(post);
      buckets[label][displayName].total += val;
      if (val > buckets[label][displayName].topVal) {
        buckets[label][displayName].topVal = val;
        buckets[label][displayName].topCap = shortCaption(
          post.caption || post.title || "",
        );
      }
    });
  });

  return Object.entries(buckets)
    .sort(([, a], [, b]) => a._ts - b._ts)
    .map(([date, vals]) => {
      const row = { date };
      Object.entries(vals).forEach(([key, v]) => {
        if (key === "_ts") return;
        row[key] = v.total;
        row[`${key}__cap`] = v.topCap;
      });
      return row;
    });
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, metric, competitors }) => {
  if (!active || !payload || payload.length === 0) return null;
  const { color: mc, field: metricField } = METRIC_CONFIG[metric] || {};

  // Get ALL posts from all competitors and get top 5 globally
  const getTop5PostsGlobally = () => {
    if (!competitors) return [];

    const allPosts = [];
    competitors.forEach((competitor) => {
      if (competitor.scrapedData?.latestPosts) {
        competitor.scrapedData.latestPosts.forEach((post) => {
          allPosts.push({
            company: getDisplayName(competitor.name),
            value: metricField(post),
            caption: shortCaption(
              post.caption || post.title || post.text || "",
            ),
            isPrimary: competitor.isPrimary,
          });
        });
      }
    });

    return allPosts.sort((a, b) => b.value - a.value).slice(0, 5);
  };

  const top5 = getTop5PostsGlobally();

  return (
    <div
      style={{
        background: "#0f172a",
        border: `1px solid ${mc}44`,
        borderRadius: 10,
        padding: "10px 12px",
        minWidth: 220,
        maxWidth: 320,
        boxShadow: "0 8px 32px rgba(0,0,0,.4)",
      }}
    >
      <p
        style={{
          fontSize: 10,
          color: "#e2e8f0",
          marginBottom: 8,
          fontWeight: 700,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        📅 Week of {label}
      </p>

      {top5.length > 0 ? (
        <div>
          <p
            style={{
              fontSize: 10,
              color: "#f8fafc",
              marginBottom: 8,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            🏆 Top 5 Posts:
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {top5.map((post, i) => (
              <li
                key={i}
                style={{
                  marginBottom: 6,
                  lineHeight: 1.35,
                  padding: "6px 8px",
                  borderRadius: "6px",
                  backgroundColor: post.isPrimary
                    ? "rgba(168, 85, 247, 0.18)"
                    : "rgba(51, 65, 85, 0.36)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                >
                  <span
                    style={{
                      color: "#cbd5e1",
                      fontWeight: 800,
                      minWidth: 20,
                      fontSize: 10,
                    }}
                  >
                    #{i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: post.isPrimary ? "#d8b4fe" : mc,
                        fontWeight: 800,
                        fontSize: 11,
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {post.company}
                    </div>
                    <div
                      style={{
                        color: "#eef2ff",
                        fontSize: "9px",
                        lineHeight: 1.3,
                      }}
                    >
                      {post.value.toLocaleString()} — "{post.caption}"
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ color: "#e2e8f0", fontSize: 10 }}>
          No posts for this period
        </p>
      )}
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Clickable platform selector chip */
const PlatformChip = ({ platform, isActive, onClick }) => {
  const { label, icon: Icon, gradient, textColor, available } = platform;

  return (
    <button
      onClick={() => available && onClick(platform.key)}
      title={available ? label : `${label} — Coming Soon`}
      style={
        isActive
          ? { borderColor: textColor, boxShadow: `0 0 0 3px ${textColor}30` }
          : {}
      }
      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200
        ${
          isActive
            ? "bg-card border-2 scale-105"
            : available
              ? "border-border bg-card hover:bg-muted/60 hover:scale-105 cursor-pointer"
              : "border-border bg-card/50 cursor-not-allowed opacity-50"
        }`}
    >
      {/* Platform icon with gradient bg */}
      <div
        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0`}
      >
        <Icon size={16} className="text-white" />
      </div>
      <span
        className="font-medium whitespace-nowrap"
        style={isActive ? { color: textColor } : {}}
      >
        {label}
      </span>

      {/* Active indicator dot */}
      {isActive && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
          style={{ background: textColor }}
        />
      )}

      {/* Coming Soon badge */}
      {!available && (
        <span className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 bg-muted border border-border rounded-full px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
          <Lock size={8} /> Soon
        </span>
      )}
    </button>
  );
};

const MetricChip = ({ metricKey, activeMetric, onClick }) => {
  const { label, icon: Icon, color } = METRIC_CONFIG[metricKey];
  const isActive = activeMetric === metricKey;
  return (
    <button
      onClick={() => onClick(metricKey)}
      style={
        isActive
          ? { borderColor: color, backgroundColor: `${color}22`, color }
          : {}
      }
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold transition-all duration-200 cursor-pointer
        ${isActive ? "shadow-sm" : "border-border text-muted-foreground hover:bg-muted/60 bg-card"}`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
};

const KPICard = ({ title, value, trend, icon: Icon, trendUp }) => (
  <Card className="p-4 bg-card border-border relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon size={64} />
    </div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Icon size={20} />
        </div>
        {trend && (
          <Badge
            variant={trendUp ? "success" : "destructive"}
            className="flex items-center gap-1"
          >
            <TrendingUp size={12} className={trendUp ? "" : "rotate-180"} />
            {trend}
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  </Card>
);

const CompanyPanel = ({ info, metric, onClose }) => {
  if (!info || !metric) return null;
  const { label, icon: Icon, color } = METRIC_CONFIG[metric];
  return (
    <div
      className="absolute top-2 right-2 z-30 bg-card border rounded-xl shadow-2xl p-4 w-64"
      style={{ borderColor: color }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-foreground text-sm truncate pr-2">
          {getDisplayName(info.companyName)}
        </span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground shrink-0"
        >
          <X size={15} />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-3" style={{ color }}>
        <Icon size={18} />
        <span className="text-2xl font-bold">
          {info.total.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground font-normal ml-1">
          {label}
        </span>
      </div>
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Calendar size={12} className="mt-0.5 shrink-0" />
        <span>
          {info.from} → {info.to}
        </span>
      </div>
    </div>
  );
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────
import { usePlatform } from "../context/PlatformContext";

const Dashboard = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { activePlatform, setActivePlatform } = usePlatform();
  const [activeMetric, setActiveMetric] = useState("likes");
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState(null);

  // Default to last 90 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  const isDark = theme === "dark";
  const gridColor = isDark ? "#1e293b" : "#f1f5f9";
  const axisColor = isDark ? "#64748b" : "#94a3b8";

  // Active platform config
  const currentPlatform = PLATFORMS.find((p) => p.key === activePlatform);

  // Fetch once on mount or when activePlatform changes
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/competitors?platform=${activePlatform}`)
      .then((r) => r.json())
      .then((data) => setCompetitors(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activePlatform]);

  // Filter by platform, then by having latestPosts
  const platformCompetitors = filterByPlatform(competitors, activePlatform);
  const activeCompanies = platformCompetitors.filter(
    (c) =>
      Array.isArray(c?.scrapedData?.latestPosts) &&
      c.scrapedData.latestPosts.length > 0,
  );

  // Get top 5 companies by followers for display (our company prioritized)
  const topFiveCompanies = React.useMemo(() => {
    const ourCompany = activeCompanies.filter((c) => c.isPrimary);
    const competitors = activeCompanies
      .filter((c) => !c.isPrimary)
      .sort((a, b) => {
        const aFollowers = Number(a.scrapedData?.followersCount) || 0;
        const bFollowers = Number(b.scrapedData?.followersCount) || 0;
        return bFollowers - aFollowers;
      });
    return [...ourCompany, ...competitors.slice(0, 4)];
  }, [activeCompanies]);

  const chartData = buildChartData(
    activeCompanies,
    activeMetric,
    startDate,
    endDate,
  );
  const hasData = chartData.length > 0;

  // ─── Analytics Calculations ───
  const analytics = React.useMemo(() => {
    if (!activeCompanies.length)
      return {
        momentum: 0,
        engagement: 0,
        velocity: "Low",
        readiness: 0,
        topics: [],
        yourCompanyData: null,
      };

    const getEng = (p) =>
      (Number(p.likesCount || p.likeCount || p.numLikes) || 0) +
      (Number(p.commentsCount || p.commentCount || p.numComments) || 0) +
      (Number(p.videoViewCount || p.videoPlayCount || p.viewCount) || 0);

    const now = new Date();
    const periodDays = 30;
    const currentStart = new Date(
      now.getTime() - periodDays * 24 * 60 * 60 * 1000,
    );
    const previousStart = new Date(
      now.getTime() - 2 * periodDays * 24 * 60 * 60 * 1000,
    );

    let currentEng = 0;
    let previousEng = 0;
    let currentLikes = 0;
    let currentComments = 0;
    let currentViews = 0;
    let postCount = 0;
    let yourCompanyLikes = 0;
    let yourCompanyComments = 0;
    let yourCompanyViews = 0;
    let yourCompanyPosts = 0;
    const wordFreq = {};

    activeCompanies.forEach((comp, idx) => {
      const posts = comp.scrapedData?.latestPosts || [];
      const isYourCompany = idx === 0; // Assume first company is "your company"

      posts.forEach((post) => {
        const ts =
          post.timestamp ||
          post.publishedAt ||
          post.postedAt ||
          post.time ||
          post.date;
        if (!ts) return;
        const d = new Date(ts);
        const eng = getEng(post);
        const likes =
          Number(post.likesCount || post.likeCount || post.numLikes) || 0;
        const comments =
          Number(post.commentsCount || post.commentCount || post.numComments) ||
          0;
        const views =
          Number(
            post.videoViewCount || post.videoPlayCount || post.viewCount,
          ) || 0;

        if (d >= currentStart) {
          currentEng += eng;
          currentLikes += likes;
          currentComments += comments;
          currentViews += views;
          postCount++;

          if (isYourCompany) {
            yourCompanyLikes += likes;
            yourCompanyComments += comments;
            yourCompanyViews += views;
            yourCompanyPosts++;
          }

          // Extract topics from captions
          const caption = post.caption || post.title || "";
          const words = caption.toLowerCase().split(/\W+/);
          words.forEach((w) => {
            if (
              w.length > 4 &&
              ![
                "about",
                "there",
                "their",
                "would",
                "could",
                "should",
                "instagram",
                "facebook",
                "linkedin",
                "content",
              ].includes(w)
            ) {
              wordFreq[w] = (wordFreq[w] || 0) + eng;
            }
          });
        } else if (d >= previousStart) {
          previousEng += eng;
        }
      });
    });

    // Calculate momentum as realistic percentage change, capped at ±100
    let momentumRaw = 0;
    if (previousEng === 0) {
      momentumRaw = currentEng > 0 ? 50 : 0; // If no previous data, show 50% momentum
    } else {
      momentumRaw = Math.round(
        ((currentEng - previousEng) / previousEng) * 100,
      );
    }
    const momentum = Math.min(Math.max(momentumRaw, -100), 100); // Cap at ±100 for realistic view

    // Velocity based on posts per week
    const weeksInPeriod = periodDays / 7;
    const postsPerWeek = postCount / weeksInPeriod;
    const velocity =
      postsPerWeek >= 8 ? "High" : postsPerWeek >= 4 ? "Medium" : "Low";

    // Readiness score: based on engagement rate and consistency
    // Target engagement: 100-1000 per post in this niche
    const avgEngPerPost = postCount > 0 ? currentEng / postCount : 0;
    const engagementQuality = Math.min(
      100,
      Math.max(0, Math.round((avgEngPerPost / 100) * 100)),
    );
    const postingConsistency = Math.min(
      100,
      Math.max(0, Math.round((postCount / (periodDays / 3)) * 100)),
    ); // Expect ~10 posts/month
    const readiness = Math.round(
      engagementQuality * 0.6 + postingConsistency * 0.4,
    );

    // Sort topics by engagement weight
    const topics = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word, weight]) => {
        // Calculate velocity based on engagement weight
        let velocity = "Low";
        if (weight >= 8000) velocity = "High";
        else if (weight >= 4000) velocity = "Medium";

        return {
          label: word.charAt(0).toUpperCase() + word.slice(1),
          weight: weight,
          count:
            weight >= 1000
              ? (weight / 1000).toFixed(1) + "k"
              : Math.round(weight),
          velocity: velocity,
        };
      });

    return {
      momentum,
      engagement: currentEng,
      velocity,
      readiness,
      topics,
      yourCompanyData: {
        likes: yourCompanyLikes,
        comments: yourCompanyComments,
        views: yourCompanyViews,
        posts: yourCompanyPosts,
        avgEngPerPost:
          yourCompanyPosts > 0
            ? Math.round(
                (yourCompanyLikes + yourCompanyComments + yourCompanyViews) /
                  yourCompanyPosts,
              )
            : 0,
      },
    };
  }, [activeCompanies]);

  // Reset selected line when platform or metric changes
  const handlePlatformChange = (key) => {
    setActivePlatform(key);
    setSelectedLine(null);
  };
  const handleChipClick = (key) => {
    setActiveMetric(key);
    setSelectedLine(null);
  };

  const handleLineClick = useCallback(
    (companyName) => {
      // companyName here is the displayName (@handle) used as dataKey
      const comp = competitors.find(
        (c) => getDisplayName(c.name) === companyName,
      );
      if (!comp) return;
      const fn = METRIC_CONFIG[activeMetric].field;
      let posts = comp.scrapedData?.latestPosts || [];

      // Apply the same date filters
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start || end) {
        posts = posts.filter((post) => {
          if (!post.timestamp) return false;
          const postDate = new Date(post.timestamp);
          if (start && postDate < start) return false;
          if (end && postDate > end) return false;
          return true;
        });
      }

      const total = posts.reduce((s, p) => s + fn(p), 0);
      const ts = posts
        .map((p) => p.timestamp)
        .filter(Boolean)
        .sort((a, b) => new Date(a) - new Date(b));
      const fmt = (v) => (v ? new Date(v).toLocaleDateString() : "N/A");
      setSelectedLine({
        companyName,
        total,
        from: fmt(ts[0]),
        to: fmt(ts[ts.length - 1]),
      });
    },
    [competitors, activeMetric, startDate, endDate],
  );

  // Platform "not available" for chart
  const platformAvailable = currentPlatform?.available;

  return (
    <div className="space-y-6">
      {/* ── Platform Selector — centered ── */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          Select Platform
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {PLATFORMS.map((platform) => (
            <PlatformChip
              key={platform.key}
              platform={platform}
              isActive={activePlatform === platform.key}
              onClick={handlePlatformChange}
            />
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Momentum Score"
          value={analytics.momentum + "%"}
          trend={
            analytics.momentum >= 0
              ? "+" + analytics.momentum + "%"
              : analytics.momentum + "%"
          }
          icon={Zap}
          trendUp={analytics.momentum >= 0}
        />
        <KPICard
          title="Engagement Trend"
          value={
            analytics.engagement >= 1000000
              ? (analytics.engagement / 1000000).toFixed(1) + "M"
              : analytics.engagement >= 1000
                ? (analytics.engagement / 1000).toFixed(1) + "k"
                : analytics.engagement
          }
          trend={
            analytics.yourCompanyData && analytics.yourCompanyData.posts > 0
              ? "Ø " + analytics.yourCompanyData.avgEngPerPost + " per post"
              : "No data"
          }
          icon={Users}
          trendUp={true}
        />
        <KPICard
          title="Topic Velocity"
          value={analytics.velocity}
          trend={analytics.topics.length + " trending"}
          icon={TrendingUp}
          trendUp
        />
        <KPICard
          title="Publish Readiness"
          value={analytics.readiness + "%"}
          trend={
            analytics.yourCompanyData
              ? analytics.yourCompanyData.posts + " posts"
              : "No data"
          }
          icon={CheckCircle}
          trendUp={analytics.readiness >= 60}
        />
      </div>

      {/* ── Trends Overview ── */}
      <Card className="bg-card border-border">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3">
            {/* Active platform icon badge */}
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${currentPlatform?.gradient} flex items-center justify-center shadow-md shrink-0`}
            >
              {currentPlatform && (
                <currentPlatform.icon size={18} className="text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Trends Overview
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  — {currentPlatform?.label}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground">
                Weekly engagement comparison across competitors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <DatePicker
                label="From"
                value={startDate}
                onChange={setStartDate}
                className="w-40"
              />
              <DatePicker
                label="To"
                value={endDate}
                onChange={setEndDate}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-4 md:pt-0">
              {Object.keys(METRIC_CONFIG).map((key) => (
                <MetricChip
                  key={key}
                  metricKey={key}
                  activeMetric={activeMetric}
                  onClick={handleChipClick}
                />
              ))}
            </div>
            <Button variant="secondary" size="sm" className="ml-auto">
              Download Report
            </Button>
          </div>
        </div>

        {/* Chart — fixed pixel height */}
        <div style={{ width: "100%", height: 340, position: "relative" }}>
          <CompanyPanel
            info={selectedLine}
            metric={activeMetric}
            onClose={() => setSelectedLine(null)}
          />

          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 bg-card/80 backdrop-blur-sm rounded-xl">
              <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">
                Loading competitor data…
              </span>
            </div>
          )}

          {/* Platform not available yet */}
          {!loading && !platformAvailable && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center text-muted-foreground px-6">
                {currentPlatform && (
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${currentPlatform.gradient} flex items-center justify-center shadow-lg opacity-60`}
                  >
                    <currentPlatform.icon size={32} className="text-white" />
                  </div>
                )}
                <p className="font-semibold text-lg">
                  {currentPlatform?.label} — Coming Soon
                </p>
                <p className="text-xs mt-2 max-w-xs mx-auto text-muted-foreground">
                  Only Instagram data is available right now. More platforms
                  will be connected in the future.
                </p>
              </div>
            </div>
          )}

          {/* No data for this platform */}
          {!loading && platformAvailable && !hasData && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-center text-muted-foreground px-6">
                <Users size={40} className="mx-auto mb-3 opacity-25" />
                <p className="font-semibold">No post data available</p>
                <p className="text-xs mt-1 max-w-xs mx-auto">
                  Add competitors via the{" "}
                  <span className="text-primary font-medium">Competitors</span>{" "}
                  page.
                </p>
              </div>
            </div>
          )}

          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={hasData && platformAvailable ? chartData : []}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              onClick={(e) => {
                if (e?.activePayload?.[0])
                  handleLineClick(e.activePayload[0].dataKey);
              }}
              style={{ cursor: hasData ? "pointer" : "default" }}
            >
              <CartesianGrid
                strokeDasharray="4 4"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke={axisColor}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: axisColor }}
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke={axisColor}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: axisColor }}
                dx={-4}
                width={48}
                tickFormatter={(v) =>
                  v >= 1_000_000
                    ? `${(v / 1e6).toFixed(1)}M`
                    : v >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : v
                }
              />
              {hasData && (
                <Tooltip
                  content={
                    <CustomTooltip
                      metric={activeMetric}
                      competitors={activeCompanies}
                    />
                  }
                  cursor={{
                    stroke: axisColor,
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                />
              )}
              {hasData && (
                <Legend
                  wrapperStyle={{ paddingTop: 16, fontSize: 12 }}
                  iconType="circle"
                  iconSize={8}
                  onClick={(e) => handleLineClick(e.dataKey)}
                  formatter={(value) => (
                    <span
                      style={{
                        color: axisColor,
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {value}
                    </span>
                  )}
                />
              )}
              {hasData &&
                platformAvailable &&
                activeCompanies.map((comp, i) => {
                  const displayName = getDisplayName(comp.name);
                  const color = COMPANY_COLORS[i % COMPANY_COLORS.length];
                  const isSelected = selectedLine?.companyName === displayName;
                  const dimmed = !!(selectedLine && !isSelected);
                  return (
                    <Line
                      key={displayName}
                      type="monotone"
                      dataKey={displayName}
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 2}
                      dot={{ r: 3, fill: color, strokeWidth: 0 }}
                      activeDot={{
                        r: 7,
                        fill: color,
                        stroke: isDark ? "#0f172a" : "#ffffff",
                        strokeWidth: 2,
                      }}
                      connectNulls
                      opacity={dimmed ? 0.2 : 1}
                      onClick={() => handleLineClick(displayName)}
                    />
                  );
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Emerging Topics
            </h3>
            <Button variant="ghost" size="icon">
              <MoreHorizontal size={18} />
            </Button>
          </div>
          <div className="space-y-3">
            {analytics.topics.length > 0 ? (
              analytics.topics.map((topic, idx) => (
                <div
                  key={topic.label}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${
                        [
                          topic.velocity === "High"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : topic.velocity === "Medium"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-slate-500/10 text-slate-600",
                          "bg-purple-500/10 text-purple-600",
                          "bg-blue-500/10 text-blue-600",
                        ][idx % 3]
                      } flex items-center justify-center`}
                    >
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {topic.label}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {topic.velocity} velocity • {topic.count} engagement
                        weight
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        topic.velocity === "High" ? "emerging" : "trending"
                      }
                    >
                      {topic.velocity === "High"
                        ? "High Growth"
                        : topic.velocity === "Medium"
                          ? "Growing"
                          : "Trending"}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/poster-generator", {
                          state: { defaultTopic: topic.label },
                        });
                      }}
                      className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="Generate Poster"
                    >
                      <Bot size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No emerging topics detected yet.
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Next Best Actions
            </h3>
            <Badge variant="purple">AI Suggested</Badge>
          </div>
          <div className="space-y-3">
            {[
              {
                color: "bg-purple-500",
                text: 'Create content plan for "Sustainable Materials"',
              },
              {
                color: "bg-cyan-500",
                text: "Schedule post for tomorrow at 10:00 AM",
              },
              { color: "bg-pink-500", text: "Review 2 pending approvals" },
            ].map(({ color, text }) => (
              <div
                key={text}
                className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors text-sm">
                    {text}
                  </span>
                </div>
                <ArrowRight
                  size={16}
                  className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                />
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <Button className="w-full">
              <Bot size={18} className="mr-2" />
              Ask AI Assistant
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
