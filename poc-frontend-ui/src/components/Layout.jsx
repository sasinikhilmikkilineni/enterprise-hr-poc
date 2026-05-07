import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Navbar from "./Navbar.jsx";
import { ToastProvider } from "./Toast.jsx";

const TITLES = {
  "/dashboard": "Dashboard",
  "/employees": "Employees",
  "/documents": "Document Center",
  "/social": "Social Feed",
  "/crm": "CRM Contacts",
};

export default function Layout() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] || "EnterpriseHR";

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-60 min-w-0">
          <Navbar title={title} />
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
