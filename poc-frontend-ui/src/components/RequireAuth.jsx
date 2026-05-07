import React, { useEffect, useState } from "react";
import { useOktaAuth } from "@okta/okta-react";
import LoadingSkeleton from "./LoadingSkeleton.jsx";

export default function RequireAuth({ children }) {
  const { authState, oktaAuth } = useOktaAuth();
  const [timedOut, setTimedOut] = useState(false);

  // If authState stays null for >4s, force redirect
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (authState && !authState.isAuthenticated) {
      oktaAuth.tokenManager.clear();
      oktaAuth.signInWithRedirect();
    }
  }, [authState, oktaAuth]);

  useEffect(() => {
    if (timedOut && !authState) {
      oktaAuth.tokenManager.clear();
      oktaAuth.signInWithRedirect();
    }
  }, [timedOut, authState, oktaAuth]);

  if (!authState || !authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        {(!authState && !timedOut) ? (
          <LoadingSkeleton rows={3} />
        ) : (
          <div className="text-slate-500 text-sm">Redirecting to login…</div>
        )}
      </div>
    );
  }

  return children;
}
