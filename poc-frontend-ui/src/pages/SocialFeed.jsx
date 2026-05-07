import React, { useState, useEffect } from "react";
import { Heart, Linkedin, Twitter, Rss } from "lucide-react";
import apiClient from "../api/client.js";

const TABS = ["All", "LinkedIn", "Twitter"];

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function PostCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2 items-center">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded-full" />
          </div>
          <div className="h-3 w-full bg-slate-100 rounded" />
          <div className="h-3 w-3/4 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded mt-3" />
        </div>
      </div>
    </div>
  );
}

export default function SocialFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("All");
  const [liked, setLiked] = useState({});

  useEffect(() => {
    apiClient
      .get("/api/social-feed")
      .then((r) => setPosts(r.data.data || []))
      .catch((e) => setError(e.message || "Failed to load feed"))
      .finally(() => setLoading(false));
  }, []);

  const toggleLike = (id) => {
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, likes: p.likes + (liked[id] ? -1 : 1) } : p
      )
    );
  };

  const filtered =
    tab === "All" ? posts : posts.filter((p) => p.platform === tab);

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Rss className="w-5 h-5 text-indigo-500" />
          Company Social Feed
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Latest posts from LinkedIn and Twitter
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Skeletons */}
      {loading &&
        Array.from({ length: 4 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}

      {/* Error */}
      {!loading && error && (
        <div className="bg-white rounded-2xl border border-red-100 p-8 text-center text-red-500 text-sm">
          {error}
        </div>
      )}

      {/* Posts */}
      {!loading &&
        !error &&
        filtered.map((post) => {
          const isLinkedIn = post.platform === "LinkedIn";
          return (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                    isLinkedIn
                      ? "bg-blue-600"
                      : "bg-gradient-to-br from-sky-400 to-sky-600"
                  }`}
                >
                  {post.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-slate-800">
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

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-4 mt-3">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors duration-200 ${
                        liked[post.id]
                          ? "text-red-500"
                          : "text-slate-400 hover:text-red-400"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${liked[post.id] ? "fill-current" : ""}`}
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
          );
        })}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Rss className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="font-medium text-slate-500">No posts for this filter</p>
        </div>
      )}
    </div>
  );
}
