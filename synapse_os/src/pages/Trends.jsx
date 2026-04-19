import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Input from "../components/ui/Input";
import Table, { TableRow, TableCell } from "../components/ui/Table";
import { Search, Filter, TrendingUp, Zap, ArrowRight } from "lucide-react";
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
import { API_BASE_URL } from "../config/apiConfig";
import { usePlatform } from "../context/PlatformContext";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", available: true },
  { key: "linkedin", label: "LinkedIn", available: true },
  { key: "tiktok", label: "TikTok", available: false },
  { key: "youtube", label: "YouTube", available: false },
  { key: "twitter", label: "X (Twitter)", available: false },
];

function weekBucket(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return null;
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ProgressBar = ({ value }) => (
  <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-2">
    <div
      className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full"
      style={{ width: `${value}%` }}
    />
  </div>
);

const Trends = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { activePlatform, setActivePlatform } = usePlatform();
  const [competitors, setCompetitors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/competitors?platform=${activePlatform}`)
      .then((r) => r.json())
      .then((data) => setCompetitors(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activePlatform]);

  const { chartData, topicsList, kpiStats, topCompanies } =
    React.useMemo(() => {
      if (!competitors.length)
        return {
          chartData: [],
          topicsList: [],
          kpiStats: null,
          topCompanies: [],
        };

      const getLikes = (p) =>
        Number(p.likesCount || p.likeCount || p.numLikes) || 0;
      const getViews = (p) =>
        Number(p.videoViewCount || p.videoPlayCount || p.viewCount) || 0;
      const getComments = (p) =>
        Number(p.commentsCount || p.commentCount || p.numComments) || 0;
      const getEng = (p) => getLikes(p) + getComments(p) + getViews(p);

      const periodData = {};
      const topicEngagement = {};

      // KPI accumulators — our company current vs previous 30 days
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      const kpi = {
        cur: { likes: 0, views: 0, comments: 0 },
        prev: { likes: 0, views: 0, comments: 0 },
        followers: 0,
        name: "",
      };

      // Top 5 companies: our company + top 4 by followers
      const ourComp = competitors.find((c) => c.isPrimary);
      const topCompsList = ourComp
        ? [
            ourComp,
            ...competitors
              .filter(
                (c) => !c.isPrimary && c.scrapedData?.latestPosts?.length > 0,
              )
              .sort(
                (a, b) =>
                  (Number(b.scrapedData?.followersCount) || 0) -
                  (Number(a.scrapedData?.followersCount) || 0),
              )
              .slice(0, 4),
          ]
        : competitors
            .filter((c) => c.scrapedData?.latestPosts?.length > 0)
            .sort(
              (a, b) =>
                (Number(b.scrapedData?.followersCount) || 0) -
                (Number(a.scrapedData?.followersCount) || 0),
            )
            .slice(0, 5);

      competitors.forEach((comp, compIdx) => {
        const isOurCompany = comp.isPrimary;
        const posts = comp.scrapedData?.latestPosts || [];

        if (isOurCompany) {
          kpi.followers = Number(comp.scrapedData?.followersCount) || 0;
          kpi.name = comp.name;
        }

        posts.forEach((post, i) => {
          const ts =
            post.timestamp ||
            post.publishedAt ||
            post.postedAt ||
            post.time ||
            post.date;
          const bucket = weekBucket(ts);
          if (!bucket) return;

          const eng = getEng(post);

          if (!periodData[bucket])
            periodData[bucket] = {
              _ts: new Date(ts),
              ourCompany: 0,
              compTotal: 0,
              compCount: 0,
            };

          if (isOurCompany) {
            periodData[bucket].ourCompany += eng;

            // Accumulate KPI stats
            const postDate = new Date(ts);
            if (!isNaN(postDate)) {
              const age = now - postDate.getTime();
              if (age <= thirtyDays) {
                kpi.cur.likes += getLikes(post);
                kpi.cur.views += getViews(post);
                kpi.cur.comments += getComments(post);
              } else if (age <= thirtyDays * 2) {
                kpi.prev.likes += getLikes(post);
                kpi.prev.views += getViews(post);
                kpi.prev.comments += getComments(post);
              }
            }
          }

          const caption = (post.caption || post.title || "").toLowerCase();
          const words = caption.split(/\W+/);

          const stopWords = [
            "instagram",
            "linkedin",
            "facebook",
            "twitter",
            "social",
            "media",
            "the",
            "and",
            "for",
            "with",
            "you",
            "this",
            "that",
            "from",
            "have",
            "are",
            "not",
            "check",
            "like",
            "follow",
            "share",
          ];
          const uniqueWords = [
            ...new Set(
              words.filter((w) => w.length > 5 && !stopWords.includes(w)),
            ),
          ].slice(0, 3);

          uniqueWords.forEach((word) => {
            const label = word.charAt(0).toUpperCase() + word.slice(1);

            if (!topicEngagement[label]) {
              topicEngagement[label] = {
                total: 0,
                sources: new Set(),
                lastEng: 0,
                prevEng: 0,
                snippets: [],
                postCount: 0,
              };
            }
            topicEngagement[label].total += eng;
            topicEngagement[label].postCount += 1;
            topicEngagement[label].sources.add(comp.name);
            if (
              topicEngagement[label].snippets.length < 2 &&
              caption.length > 20
            ) {
              topicEngagement[label].snippets.push(
                caption.substring(0, 80) + "...",
              );
            }

            const d = new Date(ts);
            const isCurrent =
              d > new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
            if (isCurrent) topicEngagement[label].lastEng += eng;
            else topicEngagement[label].prevEng += eng;
          });
        });
      });

      // Build KPI stats
      const pctChange = (cur, prev) => {
        if (prev === 0) return cur > 0 ? 100 : 0;
        return Math.round(((cur - prev) / prev) * 100);
      };
      const fmtVal = (v) =>
        v >= 1000000
          ? (v / 1000000).toFixed(1) + "M"
          : v >= 1000
            ? (v / 1000).toFixed(1) + "K"
            : v.toString();

      const totalEng = kpi.cur.likes + kpi.cur.comments + kpi.cur.views;
      const prevTotalEng = kpi.prev.likes + kpi.prev.comments + kpi.prev.views;

      const computedKpi = kpi.name
        ? [
            {
              label: "Likes (30d)",
              value: fmtVal(kpi.cur.likes),
              inc: pctChange(kpi.cur.likes, kpi.prev.likes),
              up: kpi.cur.likes >= kpi.prev.likes,
            },
            {
              label: "Views (30d)",
              value: fmtVal(kpi.cur.views),
              inc: pctChange(kpi.cur.views, kpi.prev.views),
              up: kpi.cur.views >= kpi.prev.views,
            },
            {
              label: "Comments (30d)",
              value: fmtVal(kpi.cur.comments),
              inc: pctChange(kpi.cur.comments, kpi.prev.comments),
              up: kpi.cur.comments >= kpi.prev.comments,
            },
            {
              label: "Total Engagement (30d)",
              value: fmtVal(totalEng),
              inc: pctChange(totalEng, prevTotalEng),
              up: totalEng >= prevTotalEng,
            },
          ]
        : [
            { label: "Likes", value: "—", inc: 0, up: true },
            { label: "Views", value: "—", inc: 0, up: true },
            { label: "Comments", value: "—", inc: 0, up: true },
            { label: "Total Engagement", value: "—", inc: 0, up: true },
          ];

      const formattedChart = Object.entries(periodData)
        .sort(([, a], [, b]) => a._ts - b._ts)
        .map(([date, vals]) => {
          const othersCount = Math.max(1, vals.compCount || 1);
          return {
            name: date,
            "Our Company": kpi.name ? Math.round(vals.ourCompany) : 0,
            "Competitors Avg": Math.round(vals.compTotal / othersCount),
          };
        });

      const formattedTopics = Object.entries(topicEngagement)
        .map(([label, data]) => {
          const engagement = data.total;
          const growth =
            data.lastEng > 0 && data.prevEng > 0
              ? Math.round(((data.lastEng - data.prevEng) / data.prevEng) * 100)
              : data.lastEng > data.prevEng
                ? 50
                : 0;

          return {
            topic: label,
            engagement: engagement,
            engagementFormatted:
              engagement >= 1000
                ? (engagement / 1000).toFixed(1) + "k"
                : engagement.toString(),
            growth: growth,
            postCount: data.postCount,
            sources: data.sources.size || 0,
            velocity:
              growth > 30 ? "High ⬆️" : growth > 0 ? "Medium ↗️" : "Low ↘️",
            snippets: data.snippets,
            trendUp: data.lastEng > data.prevEng,
          };
        })
        .sort((a, b) => b.engagement - a.engagement);

      return {
        chartData: formattedChart,
        topicsList: formattedTopics,
        kpiStats: computedKpi,
        topCompanies: topCompsList,
      };
    }, [competitors]);

  const filteredTopics = topicsList.filter(
    (t) =>
      t.topic.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredTopics.length / itemsPerPage);
  const paginatedTopics = filteredTopics.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset page when search or platform changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, activePlatform]);

  // Chart Colors
  const gridColor = theme === "dark" ? "#334155" : "#e2e8f0";
  const axisColor = theme === "dark" ? "#94a3b8" : "#64748b";
  const TOPIC_COLORS = ["#8b5cf6", "#06b6d4", "#f43f5e", "#f59e0b"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Trends Analysis
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Signals & topics radar powered by AI
          </p>
        </div>
        <div className="flex items-center gap-3 bg-card border rounded-xl px-3 py-1.5 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              disabled={!p.available}
              onClick={() => setActivePlatform(p.key)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                activePlatform === p.key
                  ? "bg-primary text-primary-foreground"
                  : p.available
                    ? "hover:bg-muted text-muted-foreground"
                    : "opacity-30 cursor-not-allowed"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(
          kpiStats || [
            { label: "Likes", value: "—", inc: 0, up: true },
            { label: "Views", value: "—", inc: 0, up: true },
            { label: "Comments", value: "—", inc: 0, up: true },
            { label: "Engagement Rate", value: "—", inc: 0, up: true },
          ]
        ).map((stat) => (
          <Card key={stat.label} className="p-5 flex flex-col justify-center">
            <h4 className="text-sm font-medium text-slate-500 mb-1">
              {stat.label}
            </h4>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </span>
              <span
                className={`text-sm font-semibold flex items-center px-2 py-0.5 rounded-full ${
                  stat.up
                    ? "text-emerald-500 bg-emerald-500/10"
                    : "text-red-500 bg-red-500/10"
                }`}
              >
                {stat.up ? "↑" : "↓"}{" "}
                {stat.label === "Engagement Rate"
                  ? (stat.inc >= 0 ? "+" : "") + stat.inc + "%"
                  : (stat.inc >= 0 ? "+" : "") + stat.inc + "%"}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="h-[400px]">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          📊 Your Company vs Competitors
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Weekly engagement trend comparison (last 90 days)
        </p>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                opacity={0.5}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={axisColor}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                stroke={axisColor}
                axisLine={false}
                tickLine={false}
                dx={-10}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                  borderColor: gridColor,
                  borderRadius: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="Our Company"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Competitors Avg"
                stroke="#64748b"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <p className="text-center">
              No engagement data available. Add competitors to get started.
            </p>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              🎯 What Topics Are People Talking About?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Topics sorted by total engagement across all posts
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics..."
              className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <Table
          headers={[
            "Topic",
            "Total Engagement",
            "Growth Trend",
            "Posts",
            "Context",
            "Action",
          ]}
        >
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12">
                <div className="w-8 h-8 mx-auto border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
              </TableCell>
            </TableRow>
          ) : paginatedTopics.length > 0 ? (
            paginatedTopics.map((topic, idx) => (
              <TableRow key={idx}>
                <TableCell className="relative group overflow-visible">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {topic.topic}
                    </span>
                  </div>
                  {/* Tooltip on hover showing actual post snippets */}
                  {topic.snippets && topic.snippets.length > 0 && (
                    <div className="absolute left-10 top-full mt-2 w-72 p-3 bg-slate-900 text-slate-200 text-xs rounded-lg shadow-2xl border border-slate-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-normal">
                      <p className="font-bold text-white mb-2">
                        📝 Example Posts:
                      </p>
                      <ul className="space-y-1.5 list-disc pl-4">
                        {topic.snippets.map((s, i) => (
                          <li key={i} className="line-clamp-2">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {topic.engagementFormatted}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    total engagement
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div
                    className={`font-semibold flex items-center gap-1 ${
                      topic.growth > 30
                        ? "text-emerald-600 dark:text-emerald-400"
                        : topic.growth > 0
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-500"
                    }`}
                  >
                    {topic.velocity}
                    <span className="text-xs">
                      ({topic.growth > 0 ? "+" : ""}
                      {topic.growth}%)
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {topic.postCount}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    posts
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs line-clamp-2 cursor-help group/tooltip">
                    Hover for examples
                    {topic.snippets && topic.snippets[0] && (
                      <span className="block absolute hidden group-hover/tooltip:block bg-slate-900 text-white px-2 py-1 rounded mt-1 whitespace-normal text-[11px] z-50">
                        "{topic.snippets[0]}"
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate("/video-generator", {
                        state: { defaultTopic: topic.topic },
                      })
                    }
                    className="hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 p-2"
                    title="Create content about this topic"
                  >
                    <Zap size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-12 text-muted-foreground"
              >
                {search
                  ? "No topics match your search."
                  : "No topics found. Add competitors to analyze trends."}
              </TableCell>
            </TableRow>
          )}
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredTopics.length)}
              </span>{" "}
              of <span className="font-medium">{filteredTopics.length}</span>{" "}
              topics
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)]
                  .map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        currentPage === i + 1
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))
                  .slice(
                    Math.max(0, currentPage - 3),
                    Math.min(totalPages, currentPage + 2),
                  )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Trends;
