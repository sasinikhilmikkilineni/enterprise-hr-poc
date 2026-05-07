import React from "react";
import ReactDOM from "react-dom/client";
import { OktaAuth } from "@okta/okta-auth-js";
import { Security } from "@okta/okta-react";
import App from "./App.jsx";
import oktaConfig from "./okta-config.js";
import { setOktaAuth } from "./api/client.js";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "sans-serif", color: "#ef4444" }}>
          <h2>Application Error</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function restoreOriginalUri(_oktaAuth, originalUri) {
  window.location.replace(originalUri || "/");
}

try {
  const oktaAuth = new OktaAuth(oktaConfig);
  setOktaAuth(oktaAuth);

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <ErrorBoundary>
        <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
          <App />
        </Security>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (e) {
  document.getElementById("root").innerHTML =
    `<div style="padding:40px;font-family:sans-serif;color:#dc2626">` +
    `<h2>Startup Error</h2><pre style="white-space:pre-wrap;font-size:13px">${e.stack || e.message}</pre></div>`;
}
