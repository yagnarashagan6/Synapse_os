import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Users,
  Code,
  Eye,
  User,
  Mail,
  Shield,
  MapPin,
  Link as LinkIcon,
  Edit2,
  Linkedin,
  Instagram,
  Twitter,
  Youtube,
  Music,
  CheckCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { API_BASE_URL } from "../config/apiConfig";

const SUPPORTED_PLATFORMS = [
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-500",
    border: "focus:border-blue-500",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    border: "focus:border-pink-500",
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    icon: Twitter,
    color: "text-sky-500",
    border: "focus:border-sky-500",
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: Youtube,
    color: "text-red-500",
    border: "focus:border-red-500",
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: Music,
    color: "text-white",
    border: "focus:border-slate-400",
  },
];

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("profile");

  // ── Profile state (moved from old Profile page) ──────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profiles, setProfiles] = useState({
    linkedin: {
      id: null,
      url: "",
      stats: null,
      syncing: false,
      isPrimary: false,
      error: false,
    },
    instagram: {
      id: null,
      url: "",
      stats: null,
      syncing: false,
      isPrimary: false,
      error: false,
    },
    twitter: {
      id: null,
      url: "",
      stats: null,
      syncing: false,
      isPrimary: false,
      error: false,
    },
    youtube: {
      id: null,
      url: "",
      stats: null,
      syncing: false,
      isPrimary: false,
      error: false,
    },
    tiktok: {
      id: null,
      url: "",
      stats: null,
      syncing: false,
      isPrimary: false,
      error: false,
    },
  });

  const [personalInfo, setPersonalInfo] = useState({
    full_name: "Alex Morgan",
    email: "alex.morgan@synapse.ai",
    role: "Senior Strategist",
    location: "San Francisco, CA",
    primary_account: "@nabilakadiri_nld",
  });

  useEffect(() => {
    // Fetch personal info
    fetch(`${API_BASE_URL}/api/profile`)
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setPersonalInfo({
            full_name: data.profile.full_name || "",
            email: data.profile.email || "",
            role: data.profile.role || "",
            location: data.profile.location || "",
            primary_account:
              data.profile.primary_account || "@nabilakadiri_nld",
          });
        }
      })
      .catch(console.error);

    fetchCompetitors();
  }, []);

  const fetchCompetitors = () => {
    Promise.all([
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
    ])
      .then((results) => {
        const merged = results.flat().filter((c) => c && !c.error);
        const ownCompanies = merged.filter(
          (c) => c.scrapedData?.is_own_company === true,
        );

        setProfiles((prev) => {
          const next = { ...prev };
          ownCompanies.forEach((c) => {
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

            if (next[plat]) {
              next[plat] = {
                ...next[plat],
                id: c.id,
                url: c.name,
                stats: c.scrapedData,
                isPrimary: c.isPrimary,
                error: false,
              };
            }
          });
          const savedName = localStorage.getItem("synapse_own_company_name");
          if (savedName && !next.linkedin.url) {
            const fb = merged.find((c) => c.name === savedName);
            if (fb && fb.scrapedData)
              next.linkedin = {
                ...next.linkedin,
                url: savedName,
                stats: fb.scrapedData,
              };
          }
          return next;
        });
      })
      .catch(console.error);
  };

  const handleBackgroundSync = async (platformId, targetUrl) => {
    setProfiles((p) => ({
      ...p,
      [platformId]: { ...p[platformId], syncing: true, error: false },
    }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: targetUrl,
          platform: platformId,
          isOwnCompany: true,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error || data.details);

      setProfiles((p) => ({
        ...p,
        [platformId]: {
          ...p[platformId],
          id: data.id,
          stats: data.scrapedData,
          syncing: false,
          isPrimary: data.isPrimary,
          error: false,
        },
      }));
      if (platformId === "linkedin")
        localStorage.setItem("synapse_own_company_name", data.name);
    } catch (err) {
      console.error(`Sync failed for ${platformId}:`, err);
      setProfiles((p) => ({
        ...p,
        [platformId]: { ...p[platformId], syncing: false, error: true },
      }));
    }
  };

  const updateProfileUrl = (platformId, val) => {
    setProfiles((p) => ({
      ...p,
      [platformId]: { ...p[platformId], url: val },
    }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Save personal information
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personalInfo),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Quietly dispatch background syncing for non-empty social handles
      Object.keys(profiles).forEach((platformId) => {
        const p = profiles[platformId];
        if (p.url && !p.syncing) {
          handleBackgroundSync(platformId, p.url);
        }
      });

      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save profile: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Sections ─────────────────────────────────────────────────────────
  const sections = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "organization", label: "Organization", icon: Users },
    { id: "team", label: "Team", icon: Users },
    { id: "api", label: "API Keys", icon: Code },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Eye },
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <Card className="p-2 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeSection === section.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
            >
              <section.icon size={18} />
              {section.label}
            </button>
          ))}
        </Card>
      </div>

      <div className="lg:col-span-3 space-y-6">
        {/* ── My Profile Section ────────────────────────────────────── */}
        {activeSection === "profile" && (
          <>
            {/* Profile Card + Organizations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="flex flex-col items-center text-center p-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 p-1 mb-4">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    <User size={40} className="text-slate-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {personalInfo.full_name || "Alex Morgan"}
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                  {personalInfo.role || "Senior Content Strategist"}
                </p>
                <Badge variant="purple" className="mb-6">
                  Pro Member
                </Badge>

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Member since</span>
                    <span className="text-slate-300">Jan 2024</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Projects</span>
                    <span className="text-slate-300">12 Active</span>
                  </div>
                </div>
              </Card>

              <div className="md:col-span-2 space-y-6">
                {/* Company Handles */}
                <Card className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-purple-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                      <CheckCircle size={20} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Your Company Handles
                    </h3>
                  </div>
                  <p className="text-sm text-slate-300 mb-4">
                    These accounts will be used for comparison in Analytics &
                    Trends
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {Object.entries(profiles).map(
                      ([platformId, profile]) => {
                        if (!profile.url || !profile.stats) return null;
                        const Icon = SUPPORTED_PLATFORMS.find(
                          (p) => p.id === platformId,
                        )?.icon;
                        return (
                          <div
                            key={platformId}
                            className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-lg p-3"
                          >
                            <div className="p-2 rounded-lg bg-slate-700 text-slate-300">
                              {Icon && <Icon size={16} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-slate-500 truncate">
                                {
                                  SUPPORTED_PLATFORMS.find(
                                    (p) => p.id === platformId,
                                  )?.label
                                }
                              </p>
                              <p className="text-sm font-medium text-white truncate">
                                {profile.url}
                              </p>
                            </div>
                            {profile.stats && (
                              <CheckCircle
                                size={16}
                                className="text-emerald-400 shrink-0"
                              />
                            )}
                          </div>
                        );
                      },
                    )}
                    {Object.values(profiles).every((p) => !p.url) && (
                      <div className="col-span-full text-center py-4 text-slate-400">
                        <p className="text-sm">
                          No company handles added yet. Edit profile to add
                          your social media accounts.
                        </p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Organizations */}
                <Card>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Organizations
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                        S
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-200">
                          Synapse Corp
                        </h4>
                        <p className="text-xs text-slate-500">Admin</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                        E
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-200">
                          EcoTech Ltd
                        </h4>
                        <p className="text-xs text-slate-500">Editor</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Personal Information + Social Handles */}
            <Card
              className={
                isEditing
                  ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all"
                  : "transition-all"
              }
            >
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <h3 className="text-lg font-semibold text-white">
                  Personal Information
                </h3>
                {!isEditing ? (
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 size={16} className="mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-purple-600 hover:bg-purple-500"
                  >
                    {isSaving ? (
                      <>Saving & Syncing...</>
                    ) : (
                      <>
                        <CheckCircle size={16} className="mr-2" /> Save
                        Profile
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={personalInfo.full_name}
                      onChange={(e) =>
                        setPersonalInfo({
                          ...personalInfo,
                          full_name: e.target.value,
                        })
                      }
                      icon={User}
                    />
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm">
                      <User size={16} className="text-slate-500" />{" "}
                      {personalInfo.full_name || "N/A"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">
                    Email Address
                  </label>
                  {isEditing ? (
                    <Input
                      value={personalInfo.email}
                      onChange={(e) =>
                        setPersonalInfo({
                          ...personalInfo,
                          email: e.target.value,
                        })
                      }
                      icon={Mail}
                    />
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm">
                      <Mail size={16} className="text-slate-500" />{" "}
                      {personalInfo.email || "N/A"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">
                    Role
                  </label>
                  {isEditing ? (
                    <Input
                      value={personalInfo.role}
                      onChange={(e) =>
                        setPersonalInfo({
                          ...personalInfo,
                          role: e.target.value,
                        })
                      }
                      icon={Shield}
                    />
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm">
                      <Shield size={16} className="text-slate-500" />{" "}
                      {personalInfo.role || "N/A"}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">
                    Location
                  </label>
                  {isEditing ? (
                    <Input
                      value={personalInfo.location}
                      onChange={(e) =>
                        setPersonalInfo({
                          ...personalInfo,
                          location: e.target.value,
                        })
                      }
                      icon={MapPin}
                    />
                  ) : (
                    <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm">
                      <MapPin size={16} className="text-slate-500" />{" "}
                      {personalInfo.location || "N/A"}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Social Media Handles
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Links provided below will automatically be scanned and
                  recorded as baseline "Our Company" data for the platform
                  Analytics dashboard.
                </p>

                <div className="space-y-4">
                  {SUPPORTED_PLATFORMS.map((platform) => {
                    const profile = profiles[platform.id];
                    const Icon = platform.icon;
                    return (
                      <div
                        key={platform.id}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pl-2"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg bg-slate-800 ${platform.color} border border-slate-700`}
                          >
                            <Icon size={18} />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-200">
                              {platform.label}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              {profile.syncing ? (
                                <span className="text-[10px] text-purple-400 flex items-center gap-1">
                                  <RefreshCw
                                    size={10}
                                    className="animate-spin"
                                  />{" "}
                                  Syncing in background...
                                </span>
                              ) : profile.stats ? (
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                  <CheckCircle size={10} /> Active &
                                  Connected
                                </span>
                              ) : profile.error ? (
                                <span className="text-[10px] text-red-400 flex items-center gap-1">
                                  <XCircle size={10} /> Sync Failed
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">
                                  Not Connected
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          {isEditing ? (
                            <div className="relative">
                              <LinkIcon
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                                size={16}
                              />
                              <input
                                type="text"
                                value={profile.url}
                                onChange={(e) =>
                                  updateProfileUrl(
                                    platform.id,
                                    e.target.value,
                                  )
                                }
                                placeholder={`Enter ${platform.label} URL...`}
                                className={`w-full bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg pl-9 pr-4 py-2 outline-none ${platform.border} text-white text-sm transition-colors`}
                              />
                            </div>
                          ) : (
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm opacity-80 cursor-not-allowed truncate flex items-center gap-2">
                              <LinkIcon
                                size={16}
                                className="text-slate-500 shrink-0"
                              />
                              <span className="truncate">
                                {profile.url || (
                                  <span className="text-slate-600">
                                    No URL provided
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ── Organization Section ──────────────────────────────────── */}
        {activeSection === "organization" && (
          <Card className="bg-card border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Organization Details
            </h2>
            <div className="space-y-6 max-w-2xl">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Organization Name
                </label>
                <Input defaultValue="Synapse Intelligence" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Industry
                </label>
                <Select
                  options={[
                    { value: "tech", label: "Technology & AI" },
                    { value: "marketing", label: "Digital Marketing" },
                    { value: "finance", label: "Finance" },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Contact Email
                  </label>
                  <Input defaultValue="admin@synapse.ai" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Website
                  </label>
                  <Input defaultValue="https://synapse.ai" />
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end gap-4">
                <Button variant="secondary">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── Appearance Section ─────────────────────────────────────── */}
        {activeSection === "appearance" && (
          <Card className="bg-card border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Appearance
            </h2>
            <div className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="w-full h-32 bg-white rounded-lg shadow-sm border border-slate-200 p-2 flex gap-2 overflow-hidden">
                    <div className="w-1/4 h-full bg-slate-50 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-3/4 bg-slate-100 rounded"></div>
                      <div className="h-2 w-1/2 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                  <span
                    className={`font-medium ${theme === "light" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    Light Mode
                  </span>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="w-full h-32 bg-slate-950 rounded-lg shadow-sm border border-slate-800 p-2 flex gap-2 overflow-hidden">
                    <div className="w-1/4 h-full bg-slate-900 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-3/4 bg-slate-900 rounded"></div>
                      <div className="h-2 w-1/2 bg-slate-900 rounded"></div>
                    </div>
                  </div>
                  <span
                    className={`font-medium ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    Dark Mode
                  </span>
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Settings;
