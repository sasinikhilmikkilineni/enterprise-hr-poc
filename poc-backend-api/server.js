require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const mysql = require("mysql2/promise");

const authMiddleware = require("./middleware/auth");
const apiRoutes = require("./routes/api");

const PORT = process.env.PORT || 3001;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const SECRET_NAME = process.env.AWS_SECRET_NAME || "poc/db/credentials";

async function fetchDbCredentials() {
  const client = new SecretsManagerClient({ region: AWS_REGION });
  const command = new GetSecretValueCommand({ SecretId: SECRET_NAME });
  const response = await client.send(command);
  return JSON.parse(response.SecretString);
}

async function createPool(creds) {
  return mysql.createPool({
    host: creds.host,
    user: creds.username,
    password: creds.password,
    database: creds.dbname,
    port: creds.port || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
}

async function bootstrap() {
  console.log("🔐 Fetching DB credentials from Secrets Manager...");
  let pool;

  try {
    const creds = await fetchDbCredentials();
    pool = await createPool(creds);
    // Verify connectivity
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("✅ Database pool ready");
  } catch (err) {
    console.error("❌ Failed to initialise DB pool:", err.message);
    console.warn("⚠️  Starting server without DB connection (health endpoint only)");
    pool = null;
  }

  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
    })
  );
  app.use(morgan("combined"));
  app.use(express.json({ limit: "10mb" }));

  // Root + health — no auth (ELB health checks hit /)
  app.get(["/", "/health"], (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      db: pool ? "connected" : "unavailable",
    });
  });

  // Attach pool to every request so routes can use it
  app.use((req, _res, next) => {
    req.db = pool;
    next();
  });

  // Protected API routes
  app.use("/api", authMiddleware, apiRoutes);

  // 404 fallback
  app.use((_req, res) => {
    res.status(404).json({ error: "Not Found" });
  });

  // Global error handler
  app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use. Kill the existing process and restart.`);
    } else {
      console.error("❌ Server error:", err.message);
    }
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal bootstrap error:", err);
  process.exit(1);
});
