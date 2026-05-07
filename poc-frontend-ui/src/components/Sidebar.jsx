import React from "react";
import { NavLink } from "react-router-dom";
import { useOktaAuth } from "@okta/okta-react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Rss,
  Briefcase,
  Building2,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/social", label: "Social Feed", icon: Rss },
  { to: "/crm", label: "CRM", icon: Briefcase },
];

export default function Sidebar() {
  const { authState } = useOktaAuth();
  const groups = authState?.idToken?.claims?.groups || [];
  const isHR = groups.includes("HR_Users") || groups.includes("Admin");

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-[#0f172a] flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-semibold bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent tracking-tight">
          EnterpriseHR
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isActive ? "" : "group-hover:scale-110"
                  }`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}

        {isHR && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">HR Tools</p>
            </div>
            <NavLink
              to="/hr-ask"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Sparkles
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isActive ? "" : "group-hover:scale-110"
                    }`}
                  />
                  HR Assistant
                  <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                    AI
                  </span>
                </>
              )}
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-600">Enterprise HR PoC v1.0</p>
      </div>
    </aside>
  );
}
