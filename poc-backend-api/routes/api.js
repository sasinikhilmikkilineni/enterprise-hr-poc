const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const S3_BUCKET = process.env.S3_BUCKET || "enterprise-hr-docs-poc";
const PRESIGNED_EXPIRES = 300;

// ────────────────────────────────────────────────────────────────────────────
// GET /api/employees
// ────────────────────────────────────────────────────────────────────────────
router.get("/employees", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;

  if (!req.db) {
    return res.status(503).json({ error: "Database unavailable" });
  }

  try {
    const [rows] = await req.db.query(
      `SELECT
         e.emp_no,
         e.first_name,
         e.last_name,
         e.hire_date,
         e.gender,
         d.dept_name,
         t.title,
         s.salary
       FROM employees e
       LEFT JOIN dept_emp   de ON e.emp_no = de.emp_no  AND de.to_date = '9999-01-01'
       LEFT JOIN departments d  ON de.dept_no = d.dept_no
       LEFT JOIN titles      t  ON e.emp_no = t.emp_no  AND t.to_date  = '9999-01-01'
       LEFT JOIN salaries    s  ON e.emp_no = s.emp_no  AND s.to_date  = '9999-01-01'
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return res.json({
      data: rows,
      page,
      limit,
      total_fetched: rows.length,
    });
  } catch (err) {
    console.error("GET /api/employees error:", err.message);
    return res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/departments
// ────────────────────────────────────────────────────────────────────────────
router.get("/departments", async (req, res) => {
  if (!req.db) {
    return res.status(503).json({ error: "Database unavailable" });
  }

  try {
    const [rows] = await req.db.query("SELECT * FROM departments");
    return res.json({ data: rows });
  } catch (err) {
    console.error("GET /api/departments error:", err.message);
    return res.status(500).json({ error: "Failed to fetch departments" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/documents/presigned-url
// ────────────────────────────────────────────────────────────────────────────
router.get("/documents/presigned-url", async (req, res) => {
  const { filename, action } = req.query;

  if (!filename) {
    return res.status(400).json({ error: "filename query parameter is required" });
  }
  if (!["upload", "download"].includes(action)) {
    return res
      .status(400)
      .json({ error: "action must be 'upload' or 'download'" });
  }

  try {
    const key = `hr-documents/${filename}`;
    let command;

    if (action === "upload") {
      command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        ContentType: "application/pdf",
      });
    } else {
      command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });
    }

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_EXPIRES,
    });

    return res.json({ url, expires_in: PRESIGNED_EXPIRES, filename });
  } catch (err) {
    console.error("GET /api/documents/presigned-url error:", err.message);
    return res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/notifications/slack
// ────────────────────────────────────────────────────────────────────────────
router.post("/notifications/slack", async (req, res) => {
  const { filename, uploader, action } = req.body || {};
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (webhookUrl && filename && uploader && action) {
    try {
      await axios.post(webhookUrl, {
        text: `📄 HR Document Event\n*File:* ${filename}\n*By:* ${uploader}\n*Action:* ${action}`,
      });
    } catch (err) {
      console.warn("Slack notification failed (silent):", err.message);
    }
  }

  return res.json({ success: true });
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/social-feed
// ────────────────────────────────────────────────────────────────────────────
router.get("/social-feed", (_req, res) => {
  const posts = [
    {
      id: 1,
      platform: "LinkedIn",
      author: "Sarah Johnson",
      avatar: "SJ",
      content:
        "Excited to announce we've just crossed 300,000 employees worldwide! 🎉 This milestone reflects our incredible team's dedication and growth.",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      likes: 284,
    },
    {
      id: 2,
      platform: "Twitter",
      author: "Dev Team",
      avatar: "DT",
      content:
        "Just shipped our new self-service HR portal 🚀 Employees can now manage benefits, request time off, and view pay stubs — all in one place. #HRTech #CloudFirst",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      likes: 127,
    },
    {
      id: 3,
      platform: "LinkedIn",
      author: "Michael Chen",
      avatar: "MC",
      content:
        "Our Q2 performance reviews are in — 94% of employees rated their manager experience as 'excellent' or 'very good'. Proud of our leadership culture!",
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      likes: 412,
    },
    {
      id: 4,
      platform: "Twitter",
      author: "HR Insights",
      avatar: "HI",
      content:
        "Reminder: Open enrollment ends Friday! Update your health, dental & vision benefits through the portal. Questions? Reach out to benefits@company.com 📋",
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      likes: 89,
    },
    {
      id: 5,
      platform: "LinkedIn",
      author: "Amanda Torres",
      avatar: "AT",
      content:
        "Thrilled to welcome 47 new engineers to our Cloud Infrastructure team this quarter! The pace of innovation at this company never ceases to amaze me.",
      timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      likes: 356,
    },
    {
      id: 6,
      platform: "Twitter",
      author: "CloudOps",
      avatar: "CO",
      content:
        "Zero downtime migration to Aurora Serverless v2 complete ✅ Database costs down 40%, latency down 60%. Aurora's scale-to-zero is a game changer for dev environments.",
      timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
      likes: 203,
    },
    {
      id: 7,
      platform: "LinkedIn",
      author: "Priya Patel",
      avatar: "PP",
      content:
        "Just completed our annual security audit — zero critical findings for the third consecutive year! Huge thanks to the InfoSec team for their relentless vigilance.",
      timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
      likes: 521,
    },
    {
      id: 8,
      platform: "Twitter",
      author: "EnterpriseHR",
      avatar: "EH",
      content:
        "Our new AI-powered document classification system is live in Document Center! Upload any HR document and it auto-tags by category, department, and compliance status. 🤖📄",
      timestamp: new Date(Date.now() - 1000 * 60 * 900).toISOString(),
      likes: 174,
    },
  ];

  return res.json({ data: posts });
});

// ────────────────────────────────────────────────────────────────────────────
// GET /api/sfdc/contacts
// ────────────────────────────────────────────────────────────────────────────
router.get("/sfdc/contacts", (_req, res) => {
  const contacts = [
    {
      id: "001A000001LkHj2",
      name: "James Harrington",
      email: "j.harrington@acmecorp.com",
      company: "Acme Corporation",
      title: "VP of Human Resources",
      phone: "+1 (415) 555-0182",
    },
    {
      id: "001A000001LkHj3",
      name: "Rebecca Nguyen",
      email: "r.nguyen@globex.io",
      company: "Globex Industries",
      title: "Chief People Officer",
      phone: "+1 (628) 555-0137",
    },
    {
      id: "001A000001LkHj4",
      name: "Carlos Medina",
      email: "c.medina@initech.com",
      company: "Initech Systems",
      title: "HR Director",
      phone: "+1 (512) 555-0294",
    },
    {
      id: "001A000001LkHj5",
      name: "Lauren Kim",
      email: "l.kim@soylent.co",
      company: "Soylent Corp",
      title: "Talent Acquisition Manager",
      phone: "+1 (213) 555-0361",
    },
    {
      id: "001A000001LkHj6",
      name: "Thomas Okafor",
      email: "t.okafor@umbrella.net",
      company: "Umbrella Technologies",
      title: "Benefits & Compensation Lead",
      phone: "+1 (312) 555-0479",
    },
    {
      id: "001A000001LkHj7",
      name: "Sophia Reyes",
      email: "s.reyes@cyberdyne.ai",
      company: "Cyberdyne AI",
      title: "People Operations Specialist",
      phone: "+1 (408) 555-0523",
    },
    {
      id: "001A000001LkHj8",
      name: "David Park",
      email: "d.park@weyland.corp",
      company: "Weyland Corp",
      title: "HRIS Manager",
      phone: "+1 (206) 555-0618",
    },
    {
      id: "001A000001LkHj9",
      name: "Natalie Osei",
      email: "n.osei@tyrell.corp",
      company: "Tyrell Corporation",
      title: "Learning & Development Director",
      phone: "+1 (650) 555-0742",
    },
    {
      id: "001A000001LkHjA",
      name: "Brandon Wallace",
      email: "b.wallace@lexcorp.biz",
      company: "LexCorp",
      title: "Employee Experience Manager",
      phone: "+1 (646) 555-0895",
    },
    {
      id: "001A000001LkHjB",
      name: "Mei Lin Zhang",
      email: "ml.zhang@oscorp.com",
      company: "Oscorp Industries",
      title: "Workforce Planning Analyst",
      phone: "+1 (718) 555-0961",
    },
  ];

  return res.json({ data: contacts });
});

// ────────────────────────────────────────────────────────────────────────────
// POST /api/hr/ask  — HR-only AI assistant
// ────────────────────────────────────────────────────────────────────────────
router.post("/hr/ask", async (req, res) => {
  const groups = req.user?.groups || [];
  if (!groups.includes("HR_Users") && !groups.includes("Admin")) {
    return res.status(403).json({ error: "HR access required" });
  }

  const { question } = req.body || {};
  if (!question || typeof question !== "string" || question.trim().length === 0) {
    return res.status(400).json({ error: "question is required" });
  }

  if (!req.db) {
    return res.status(503).json({ error: "Database unavailable" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "AI assistant not configured" });
  }

  try {
    // Pull a focused dataset: top 500 employees with all HR fields
    const [rows] = await req.db.query(
      `SELECT
         e.emp_no,
         e.first_name,
         e.last_name,
         e.hire_date,
         e.gender,
         d.dept_name,
         t.title,
         s.salary
       FROM employees e
       LEFT JOIN dept_emp   de ON e.emp_no = de.emp_no AND de.to_date = '9999-01-01'
       LEFT JOIN departments d  ON de.dept_no = d.dept_no
       LEFT JOIN titles      t  ON e.emp_no = t.emp_no  AND t.to_date  = '9999-01-01'
       LEFT JOIN salaries    s  ON e.emp_no = s.emp_no  AND s.to_date  = '9999-01-01'
       LIMIT 200`
    );

    const dataText = rows
      .map(
        (r) =>
          `#${r.emp_no} | ${r.first_name} ${r.last_name} | Dept: ${r.dept_name || "N/A"} | Title: ${r.title || "N/A"} | Salary: $${r.salary || "N/A"} | Hired: ${r.hire_date ? new Date(r.hire_date).toISOString().slice(0, 10) : "N/A"} | Gender: ${r.gender || "N/A"}`
      )
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content:
            "You are an HR data assistant. You are given a dataset of employees and must answer HR questions accurately and concisely. Only use the data provided. If the answer is not in the data, say so. Never make up information. Format numbers clearly (e.g. salaries with $). Keep responses under 150 words.",
        },
        {
          role: "user",
          content: `Employee dataset (first 200 active employees):\n${dataText}\n\nHR Question: ${question.trim()}`,
        },
      ],
    });

    const answer = completion.choices[0]?.message?.content || "No answer generated.";
    return res.json({ answer });
  } catch (err) {
    console.error("POST /api/hr/ask error:", err.message);
    return res.status(500).json({ error: "Failed to process question" });
  }
});

module.exports = router;
