import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginCallback } from "@okta/okta-react";
import RequireAuth from "./components/RequireAuth.jsx";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees.jsx";
import DocumentCenter from "./pages/DocumentCenter.jsx";
import SocialFeed from "./pages/SocialFeed.jsx";
import CRMContacts from "./pages/CRMContacts.jsx";
import HRAsk from "./pages/HRAsk.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login/callback" element={<LoginCallback />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/documents" element={<DocumentCenter />} />
          <Route path="/social" element={<SocialFeed />} />
          <Route path="/crm" element={<CRMContacts />} />
          <Route path="/hr-ask" element={<HRAsk />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
