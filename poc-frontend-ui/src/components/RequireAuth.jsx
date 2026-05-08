import React, { useEffect, useState } from "react";
import { useOktaAuth } from "@okta/okta-react";
import LoadingSkeleton from "./LoadingSkeleton.jsx";
import LoginPage from "../pages/LoginPage.jsx";

export default function RequireAuth({ children }) {
  const { authState, oktaAuth } = useOktaAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!authState && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSkeleton rows={3} />
      </div>
    );
  }

  if (!authState?.isAuthenticated) {
    return <LoginPage />;
  }

  return children;
}
