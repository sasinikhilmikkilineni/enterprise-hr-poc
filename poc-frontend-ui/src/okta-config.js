const oktaConfig = {
  clientId: "0oa12qgbqpsJsIGgc698",
  issuer: "https://integrator-3623755.okta.com/oauth2/default",
  redirectUri: typeof window !== "undefined"
    ? `${window.location.origin}/login/callback`
    : "http://localhost:5173/login/callback",
  scopes: ["openid", "profile", "email"],
  pkce: true,
  tokenManager: {
    autoRenew: false,
    autoRemove: true,
  },
};

export default oktaConfig;
