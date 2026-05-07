const OktaJwtVerifier = require("@okta/jwt-verifier");

const jwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER || "https://integrator-3623755.okta.com/oauth2/default",
  clientId: process.env.OKTA_CLIENT_ID || "0oa12qgbqpsJsIGgc698",
});

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or malformed Authorization header. Expected: Bearer <token>",
    });
  }

  const token = authHeader.slice(7);

  try {
    const jwt = await jwtVerifier.verifyAccessToken(token, "api://default");
    const claims = jwt.claims;

    req.user = {
      id: claims.sub,
      email: claims.email || claims.sub,
      name: claims.name || claims.email || claims.sub,
      groups: claims.groups || [],
    };

    next();
  } catch (err) {
    console.warn("JWT verification failed:", err.message);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
}

module.exports = authMiddleware;
