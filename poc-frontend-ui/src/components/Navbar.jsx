import React from "react";
import { useOktaAuth } from "@okta/okta-react";
import { LogOut, Bell } from "lucide-react";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Navbar({ title }) {
  const { authState, oktaAuth } = useOktaAuth();
  const name = authState?.idToken?.claims?.name || "User";
  const email = authState?.idToken?.claims?.email || "";
  const initials = getInitials(name);

  const handleLogout = async () => {
    await oktaAuth.signOut({ postLogoutRedirectUri: window.location.origin });
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-200">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full" />
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold select-none">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-sm font-medium text-slate-700 leading-tight">
                  {name}
                </span>
                <span className="text-xs text-slate-400 leading-tight">
                  {email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
