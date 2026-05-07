import React, { useState, useEffect } from "react";
import { Briefcase } from "lucide-react";
import apiClient from "../api/client.js";

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-pink-500",
];

export default function CRMContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get("/api/sfdc/contacts")
      .then((r) => setContacts(r.data.data || []))
      .catch((e) => setError(e.message || "Failed to load contacts"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-500" />
            Salesforce CRM Contacts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Integrated via SFDC API
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          Salesforce Connected
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Contact", "Email", "Company", "Title", "Phone"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading && error && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && contacts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Briefcase className="w-10 h-10 opacity-30" />
                      <p className="font-medium">No contacts found</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                contacts.map((c, i) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors duration-150"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                            AVATAR_COLORS[i % AVATAR_COLORS.length]
                          }`}
                        >
                          {getInitials(c.name)}
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{c.email}</td>
                    <td className="px-5 py-3 text-slate-600 font-medium whitespace-nowrap">
                      {c.company}
                    </td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {c.title}
                    </td>
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">
                      {c.phone}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
