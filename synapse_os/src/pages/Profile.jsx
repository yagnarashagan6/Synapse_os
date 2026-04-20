import React, { useState, useEffect, useMemo } from "react";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import {
  TrendingUp,
  Users,
  Zap,
  Target,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Award,
  Sparkles,
  ChevronRight,
  FileText,
  UserCheck,
  Percent,
  Star,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { API_BASE_URL } from "../config/apiConfig";

// ─── Custom Tooltip for Chart ─────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(139, 92, 246, 0.3)",
        borderRadius: 12,
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: "#94a3b8",
          marginBottom: 8,
          fontWeight: 600,
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: entry.color,
            }}
          />
          <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500 }}>
            {entry.name}:
          </span>
          <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>
            {typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat Card Component ──────────────────────────────────────────────────────

const StatCard = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  gradient,
  iconBg,
  delay = 0,
}) => {
  const isPositive = change && !change.startsWith("-");
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/50 backdrop-blur-xl p-5 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient glow */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradient}`}
        style={{ filter: "blur(40px)" }}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`p-2.5 rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon size={20} className="text-white" />
          </div>
          {change && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                isPositive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight size={12} />
              ) : (
                <ArrowDownRight size={12} />
              )}
              {change}
            </div>
          )}
        </div>
        <h3 className="text-sm font-medium text-slate-400 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        {changeLabel && (
          <p className="text-[11px] text-slate-500 mt-1">{changeLabel}</p>
        )}
      </div>
    </div>
  );
};

// ─── Performance Bar ──────────────────────────────────────────────────────────

const PerformanceBar = ({ label, value, max = 100, color }) => {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="text-white font-bold">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
          }}
        />
      </div>
    </div>
  );
};

// ─── Main Profile / Growth Dashboard ──────────────────────────────────────────

const Profile = () => {
  const [metricoolData, setMetricoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState("all");

  // Fetch Metricool account data (commented out for now to ensure hardcoded data is used)
  useEffect(() => {
    /*
    const fetchMetricoolData = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/sharing/metricool/accounts`,
        );
        const data = await res.json();
        if (data.success && data.accounts) {
          setMetricoolData(data.accounts);
        }
      } catch (err) {
        console.error("[Growth Dashboard] Metricool fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetricoolData();
    */
    setLoading(false);
  }, []);

  // Derive stats from Metricool data or use showcase defaults
  const stats = useMemo(() => {
    /*
    // If we have real Metricool data, extract what we can
    if (metricoolData && typeof metricoolData === "object") {
      // Extract data from Metricool accounts response
      const accounts = Array.isArray(metricoolData)
        ? metricoolData
        ...
    */

    // Default showcase data matching the user's design
    return {
      followers: 912,
      following: 442,
      followerGrowth: 2840,
      followerGrowthPercent: 42,
      engagementRate: 8.4,
      engagementChange: 2.1,
      contentScore: 94,
      contentScoreChange: 18,
      audienceReach: 48300,
      audienceReachPercent: 67,
      weeklyFollowers: 12,
      dailyGrowth: 95,
      postsPublished: 251,
      bestPerforming: "Influence",
      activeUsers: 8900,
      activeRate: 72,
      targetReached: 94,
      platformCount: 1,
      username: "nabilakadiri_nld",
      profileName: "Nabila Kadiri",
      bio: "Je t’aide à imposer ta présence & ton impact\nInfluence • communication • décisions claires\nMéthodes ARC &...\nmore",
      website: "bit.ly/4apL9Z7",
    };
  }, [metricoolData]);

  // Chart data for 30-day performance
  const chartData = useMemo(() => {
    const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
    const baseFollowers = stats.followers - stats.followerGrowth;
    const weeklyIncrement = stats.followerGrowth / 4;
    return weeks.map((week, i) => ({
      name: week,
      Followers: Math.round(baseFollowers + weeklyIncrement * (i + 1)),
      Engagement: Math.round(
        (stats.engagementRate - 2 + (2 / 3) * (i + 1)) * 100,
      ),
      Reach: Math.round(
        (stats.audienceReach / 4) * (0.6 + 0.15 * i) + Math.random() * 2000,
      ),
    }));
  }, [stats]);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Instagram-Style Profile Header ───────────────────────────── */}
      <Card className="relative overflow-hidden border-slate-800/60 bg-slate-900/40 backdrop-blur-xl p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          {/* Profile Picture */}
          <div className="flex-shrink-0 relative">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]">
              <div className="w-full h-full rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center overflow-hidden">
                <img
                  src="/nabila.jpeg"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div
              className="absolute bottom-1 right-1 bg-emerald-500 border-2 border-slate-900 w-6 h-6 rounded-full"
              title="Active"
            ></div>
          </div>

          {/* Profile Details */}
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-4">
              <h1 className="text-xl md:text-2xl font-semibold text-white">
                {stats.username}
              </h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant="purple"
                  className="flex items-center gap-1.5 px-3 py-1"
                >
                  <Sparkles size={12} />
                  Powered by Metricool
                </Badge>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 md:gap-10 mb-4 text-white">
              <div className="text-center md:text-left">
                <span className="font-bold text-lg">
                  {stats.postsPublished}
                </span>
                <span className="text-slate-300 text-sm ml-1.5 hidden md:inline">
                  posts
                </span>
                <div className="text-slate-300 text-xs md:hidden">posts</div>
              </div>
              <div className="text-center md:text-left cursor-pointer hover:opacity-80">
                <span className="font-bold text-lg">{stats.followers}</span>
                <span className="text-slate-300 text-sm ml-1.5 hidden md:inline">
                  followers
                </span>
                <div className="text-slate-300 text-xs md:hidden">
                  followers
                </div>
              </div>
              <div className="text-center md:text-left cursor-pointer hover:opacity-80">
                <span className="font-bold text-lg">{stats.following}</span>
                <span className="text-slate-300 text-sm ml-1.5 hidden md:inline">
                  following
                </span>
                <div className="text-slate-300 text-xs md:hidden">
                  following
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="text-white text-sm md:text-base max-w-lg space-y-1">
              <p className="font-bold">{stats.profileName}</p>
              {stats.bio.split("\n").map((line, i) => (
                <p key={i} className="text-slate-200">
                  {line}
                </p>
              ))}
              <a
                href={`https://${stats.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-medium break-all block mt-1"
              >
                {stats.website}
              </a>
            </div>

            {/* This Week's Achievement Mini-Banner */}
            <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 inline-flex">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg shrink-0">
                <Award size={16} className="text-emerald-400" />
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                You gained{" "}
                <span className="font-bold text-emerald-400">
                  +{stats.weeklyFollowers} followers
                </span>{" "}
                this week thanks to Synapse OS.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── KPI Stats Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Follower Growth"
          value={`+${formatNumber(stats.followerGrowth)}`}
          change={`+${stats.followerGrowthPercent}%`}
          icon={Users}
          gradient="from-purple-500/10 to-transparent"
          iconBg="bg-gradient-to-br from-purple-500 to-purple-700"
          delay={0}
        />
        <StatCard
          title="Engagement Rate"
          value={`${stats.engagementRate}%`}
          change={`+${stats.engagementChange}%`}
          icon={Heart}
          gradient="from-pink-500/10 to-transparent"
          iconBg="bg-gradient-to-br from-pink-500 to-rose-700"
          delay={100}
        />
        <StatCard
          title="Content Performance"
          value={`${stats.contentScore}/100`}
          change={`+${stats.contentScoreChange}pts`}
          icon={Target}
          gradient="from-cyan-500/10 to-transparent"
          iconBg="bg-gradient-to-br from-cyan-500 to-teal-700"
          delay={200}
        />
        <StatCard
          title="Audience Reach"
          value={formatNumber(stats.audienceReach)}
          change={`+${stats.audienceReachPercent}%`}
          icon={Eye}
          gradient="from-amber-500/10 to-transparent"
          iconBg="bg-gradient-to-br from-amber-500 to-orange-700"
          delay={300}
        />
      </div>

      {/* ── 30-Day Performance Chart ──────────────────────────────────── */}
      <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={18} className="text-purple-400" />
              30-Day Performance Overview
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {["Week 1", "Week 2", "Week 3", "Week 4", "all"].map((w) => (
              <button
                key={w}
                onClick={() => setActiveWeek(w)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeWeek === w
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent"
                }`}
              >
                {w === "all" ? "All" : w}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[280px] -mx-2">
          <ResponsiveContainer
            width="100%"
            height={280}
            minWidth={0}
            minHeight={0}
          >
            <AreaChart
              data={
                activeWeek === "all"
                  ? chartData
                  : chartData.filter((d) => d.name === activeWeek)
              }
              margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
            >
              <defs>
                <linearGradient
                  id="followerGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="engagementGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#475569"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#475569"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="Followers"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#followerGradient)"
                dot={{
                  r: 4,
                  fill: "#8b5cf6",
                  strokeWidth: 2,
                  stroke: "#1e1b4b",
                }}
                activeDot={{
                  r: 6,
                  stroke: "#8b5cf6",
                  strokeWidth: 2,
                  fill: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="Engagement"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#engagementGradient)"
                dot={{
                  r: 3,
                  fill: "#22d3ee",
                  strokeWidth: 2,
                  stroke: "#0c4a6e",
                }}
                activeDot={{
                  r: 5,
                  stroke: "#22d3ee",
                  strokeWidth: 2,
                  fill: "#fff",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Trend Footer */}
        <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">
              Growth Trend
            </span>
          </div>
          <span className="text-sm text-slate-400">
            Average Daily Growth:{" "}
            <span className="text-white font-bold">
              +{stats.dailyGrowth} followers/day
            </span>
          </span>
        </div>
      </Card>

      {/* ── Bottom Grid: Content Performance + Audience Insights ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Performance */}
        <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-cyan-500/15 rounded-lg">
              <FileText size={18} className="text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white">
              Content Performance
            </h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/40 rounded-xl p-3 text-center border border-slate-700/40">
                <p className="text-2xl font-bold text-white">
                  {stats.postsPublished}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
                  Posts Published
                </p>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-3 text-center border border-slate-700/40">
                <p className="text-2xl font-bold text-white">
                  {stats.engagementRate}%
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
                  Avg Engagement
                </p>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-3 text-center border border-slate-700/40">
                <p className="text-2xl font-bold text-purple-400">
                  {stats.bestPerforming}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
                  Best Performing
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <PerformanceBar
                label="Post Engagement"
                value={stats.engagementRate}
                max={15}
                color="#8b5cf6"
              />
              <PerformanceBar
                label="Content Score"
                value={stats.contentScore}
                max={100}
                color="#22d3ee"
              />
              <PerformanceBar
                label="Audience Relevance"
                value={stats.targetReached}
                max={100}
                color="#f59e0b"
              />
            </div>
          </div>
        </Card>

        {/* Audience Insights */}
        <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-purple-500/15 rounded-lg">
              <UserCheck size={18} className="text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-white">
              Audience Insights
            </h3>
          </div>

          <div className="space-y-4">
            {/* Followers overview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} className="text-purple-400" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    Total Followers
                  </span>
                </div>
                <p className="text-xl font-bold text-white">
                  {formatNumber(stats.followers)}
                </p>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={14} className="text-emerald-400" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                    Active Users
                  </span>
                </div>
                <p className="text-xl font-bold text-white">
                  {formatNumber(stats.activeUsers)}
                </p>
              </div>
            </div>

            {/* Engagement & Monthly Growth */}
            <div className="bg-gradient-to-br from-purple-900/20 to-slate-900/20 rounded-xl p-4 border border-purple-500/15">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Engagement Rate
                </span>
                <span className="text-xl font-bold text-purple-400">
                  {stats.activeRate}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-1000"
                  style={{ width: `${stats.activeRate}%` }}
                />
              </div>
            </div>

            {/* Monthly Growth Section */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/40 rounded-xl p-3 text-center border border-slate-700/40">
                <p className="text-lg font-bold text-emerald-400">
                  +{formatNumber(stats.followerGrowth)}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
                  New Followers
                </p>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-3 text-center border border-slate-700/40">
                <p className="text-lg font-bold text-cyan-400">
                  +{stats.followerGrowthPercent}%
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
                  Growth Rate
                </p>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-3 text-center border border-slate-700/40">
                <p className="text-lg font-bold text-amber-400">
                  {stats.targetReached}%
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
                  Target Reached
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
