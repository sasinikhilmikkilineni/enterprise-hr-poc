import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  FileUp,
  Activity,
  Heart,
  Linkedin,
  Twitter,
} from "lucide-react";
import apiClient from "../api/client.js";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";

function StatCard({ icon: Icon, label, value, iconBg, iconColor, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
      {trend && (
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
          {trend}
        </span>
      )}
    </div>
  );
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Dashboard() {
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [liked, setLiked] = useState({});

  useEffect(() => {
    apiClient
      .get("/api/social-feed")
      .then((r) => setFeed(r.data.data || []))
      .catch((e) => setFeedError(e.message || "Failed to load feed"))
      .finally(() => setFeedLoading(false));
  }, []);

  const toggleLike = (id) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
    setFeed((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, likes: p.likes + (liked[id] ? -1 : 1) } : p
      )
    );
  };

  const stats = [
    {
      icon: Users,
      label: "Total Employees",
      value: "300,024",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      trend: "+2.4%",
    },
    {
      icon: Building2,
      label: "Departments",
      value: "9",
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      icon: FileUp,
      label: "Documents Uploaded",
      value: "1,248",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      trend: "+18 today",
    },
    {
      icon: Activity,
      label: "System Status",
      value: "Online",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      trend: "99.98%",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Social Feed Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Company Social Feed
          </h2>
          <span className="text-xs text-slate-400">Live updates</span>
        </div>

        <div className="p-6">
          {feedLoading && <LoadingSkeleton rows={3} cols={4} />}

          {feedError && (
            <div className="text-center py-8 text-red-500 text-sm">
              {feedError}
            </div>
          )}

          {!feedLoading && !feedError && (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />

              <div className="space-y-6">
                {feed.map((post) => {
                  const isLinkedIn = post.platform === "LinkedIn";
                  return (
                    <div key={post.id} className="flex gap-4 relative pl-10">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                          isLinkedIn ? "bg-blue-600" : "bg-sky-400"
                        }`}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                              isLinkedIn
                                ? "bg-blue-600"
                                : "bg-gradient-to-br from-sky-400 to-sky-600"
                            }`}
                          >
                            {post.avatar}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-slate-800">
                                {post.author}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                  isLinkedIn
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-sky-50 text-sky-700"
                                }`}
                              >
                                {isLinkedIn ? (
                                  <Linkedin className="w-3 h-3" />
                                ) : (
                                  <Twitter className="w-3 h-3" />
                                )}
                                {post.platform}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <button
                                onClick={() => toggleLike(post.id)}
                                className={`flex items-center gap-1.5 text-xs transition-colors duration-200 ${
                                  liked[post.id]
                                    ? "text-red-500"
                                    : "text-slate-400 hover:text-red-400"
                                }`}
                              >
                                <Heart
                                  className={`w-3.5 h-3.5 ${liked[post.id] ? "fill-current" : ""}`}
                                />
                                {post.likes}
                              </button>
                              <span className="text-xs text-slate-400">
                                {timeAgo(post.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
