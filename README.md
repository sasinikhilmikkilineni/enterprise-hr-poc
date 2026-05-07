# Enterprise HR PoC — SJSU Cloud Systems Final Project

Full-stack enterprise HR portal demonstrating cloud-native architecture on AWS with Okta SSO, Aurora Serverless v2, Jenkins CI/CD, and role-based access control.

**Live App:** https://dfursqwpbd2i0.cloudfront.net

## Stack

| Layer       | Technology                                               |
|-------------|----------------------------------------------------------|
| Frontend    | React 18 + Vite + Tailwind CSS, deployed to S3 + CloudFront |
| Backend     | Node.js 20 + Express on Elastic Beanstalk               |
| Database    | Aurora Serverless v2 MySQL (employees dataset)          |
| Auth        | Okta OIDC PKCE — SSO with role-based groups + GitHub Social IDP |
| CI/CD       | GitHub → Jenkins (EC2, Okta SSO) → Elastic Beanstalk / S3 |
| AI          | OpenAI GPT-4o-mini — HR AI Assistant (HR users only)    |
| Storage     | S3 with presigned URLs (upload + download)              |
| Secrets     | AWS Secrets Manager                                     |
| IaC         | AWS CDK v2 (TypeScript)                                 |

## Repository Structure

```
.
├── poc-frontend-ui/      # React SPA — Okta PKCE auth, Tailwind UI
├── poc-backend-api/      # Express REST API — Okta JWT middleware, Aurora, S3
├── infrastructure/       # AWS CDK stacks (VPC, Aurora, S3, IAM, EB)
├── okta-setup/           # Python automation for Okta provisioning
└── README.md
```

## Features

| Feature                  | Description                                              |
|--------------------------|----------------------------------------------------------|
| Okta SSO                 | OIDC PKCE login, two user groups; GitHub Social IDP for GitHub login |
| Employee Directory       | Paginated table — salary/hire date/gender hidden from non-HR |
| Document Center          | HR-only S3 document upload/download with presigned URLs  |
| HR AI Assistant          | Ask natural language questions about employees (HR only) |
| Social Feed              | Company social media posts aggregator                    |
| CRM Contacts             | Salesforce-style external HR contacts                    |
| Jenkins CI/CD            | Auto-deploy on GitHub push via Jenkins on EC2            |

## RBAC Matrix

| Feature              | Standard_Employees | HR_Users | Admin |
|----------------------|--------------------|----------|-------|
| Dashboard            | ✅                 | ✅       | ✅    |
| Employee Directory   | ✅ (limited)       | ✅ (full)| ✅    |
| Document Center      | ❌                 | ✅       | ✅    |
| HR AI Assistant      | ❌                 | ✅       | ✅    |
| Social Feed          | ✅                 | ✅       | ✅    |
| CRM Contacts         | ✅                 | ✅       | ✅    |

## API Endpoints

| Method | Path                           | Auth     | Description                        |
|--------|--------------------------------|----------|------------------------------------|
| GET    | `/health`                      | No       | Health check                       |
| GET    | `/api/employees`               | Yes      | Paginated employees list           |
| GET    | `/api/departments`             | Yes      | All departments                    |
| GET    | `/api/documents/presigned-url` | Yes      | S3 presigned upload/download URL   |
| POST   | `/api/notifications/slack`     | Yes      | Slack webhook notification         |
| GET    | `/api/social-feed`             | Yes      | Company social posts               |
| GET    | `/api/sfdc/contacts`           | Yes      | CRM contacts                       |
| POST   | `/api/hr/ask`                  | HR only  | AI employee query (OpenAI)         |

## SSO Architecture

```
  Browser
     │
     ├──► HR Portal (CloudFront)
     │       │ Okta OIDC PKCE
     │       ▼
     │    Okta IdP ◄──── GitHub Social IDP (OAuth2)
     │    (integrator-3623755.okta.com)
     │       │ JWT
     │       ▼
     │    Express API (EB) — verifies Okta JWT
     │
     └──► Jenkins CI (98.82.11.217:8080)
              │ Okta OIDC (oic-auth plugin)
              ▼
           Okta IdP (Jenkins CI app, OIDC)
```

## CI/CD Pipeline

```
Developer pushes to GitHub
         │
         ▼
   GitHub Webhook
         │
         ▼
  Jenkins on EC2 (Okta SSO via OIDC)
         │
    ┌────┴────┐
    ▼         ▼
 Backend   Frontend
 Install   Install
 Test      Build
 Package   Package
 Deploy    Deploy
    │         │
    ▼         ▼
Elastic    S3 +
Beanstalk  CloudFront
```

## Infrastructure Diagram

```
              Browser
                 │ HTTPS
                 ▼
     ┌─────────────────────┐
     │  CloudFront CDN     │
     │  dfursqwpbd2i0      │
     └──────┬──────────────┘
            │              │
     /api/* │         /* (frontend)
            ▼              ▼
  ┌──────────────┐   ┌───────────┐
  │  Elastic     │   │  S3       │
  │  Beanstalk   │   │  Bucket   │
  │  (Express)   │   │  (React)  │
  └──────┬───────┘   └───────────┘
         │
    ┌────┴──────────────────┐
    │                       │
    ▼                       ▼
Aurora Serverless v2    S3 Bucket
MySQL (employees DB)    (HR Documents)
    │
    ▼
Secrets Manager
(DB credentials)
```

## Setup

### 1. Clone

```bash
git clone https://github.com/sasinikhilmikkilineni/enterprise-hr-poc.git
cd enterprise-hr-poc
```

### 2. Backend

```bash
cd poc-backend-api
cp .env.example .env
# Fill in AWS_REGION, OKTA_ISSUER, OKTA_CLIENT_ID, OPENAI_API_KEY
npm install
npm start
```

### 3. Frontend

```bash
cd poc-frontend-ui
cp .env.example .env
# VITE_API_URL= (leave empty for CloudFront proxy)
npm install
npm run dev
```

### 4. Deploy (via Jenkins)

Push to `main` branch — Jenkins webhook triggers automatic build and deploy to AWS.

## Tech Highlights

- **Aurora Serverless v2** scales to zero when idle — cost-efficient for PoC
- **CloudFront `/api/*` behavior** proxies HTTPS → HTTP to Elastic Beanstalk, solving mixed-content
- **Okta PKCE** — no client secret stored in frontend, secure for SPAs
- **Groups claim on ID token** — enables frontend RBAC without extra API calls
- **OpenAI GPT-4o-mini** — HR staff can query employee data in natural language
