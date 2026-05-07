# Enterprise Cloud PoC

Full-stack enterprise HR portal demonstrating cloud-native architecture on AWS with Okta SSO, Aurora Serverless, CI/CD via CodePipeline + Jenkins, and layered RBAC.

## Stack

| Layer      | Technology                                         |
|------------|----------------------------------------------------|
| Frontend   | React 18 + Vite + Tailwind CSS on Elastic Beanstalk |
| Backend    | Node.js 20 + Express on Elastic Beanstalk         |
| Database   | Aurora Serverless v2 MySQL (employees dataset)    |
| Auth       | Okta OIDC (app PKCE) + SAML (Jenkins)             |
| CI/CD      | GitHub → CodePipeline → Jenkins → Beanstalk       |
| Storage    | S3 with presigned URLs (upload + download)        |
| Secrets    | AWS Secrets Manager (`poc/db/credentials`)        |
| IaC        | AWS CDK v2 (TypeScript)                           |

## Repository Structure

```
.
├── okta-setup/           # Python automation — users, groups, app assignment
├── poc-backend-api/      # Express REST API with Okta JWT auth
├── poc-frontend-ui/      # React SPA with Okta PKCE + enterprise UI
├── infrastructure/       # AWS CDK stacks (VPC, Aurora, S3, IAM, EB, Pipeline)
└── README.md
```

## Setup Order

### Step 1 — Provision Okta

```bash
cd okta-setup
pip install -r requirements.txt
export OKTA_API_TOKEN=<your_token>
python setup_okta.py
```

### Step 2 — Add Groups Claim in Okta (Manual)

> This **cannot** be automated via API and must be done manually.

1. Go to **Okta Admin → Applications → Employee Portal PoC**
2. Click **Sign On** tab → **Edit**
3. Under **Groups claim**, add:
   - **Claim name:** `groups`
   - **Filter:** `Matches regex`
   - **Value:** `.*`
4. Click **Save**

This populates `groups` in the ID token, enabling frontend RBAC (Document Center access).

### Step 3 — Deploy AWS Infrastructure

```bash
cd infrastructure
npm install

# Bootstrap CDK (first time only)
cdk bootstrap aws://<account-id>/us-east-1

# Deploy all stacks
cdk deploy --all
```

### Step 4 — Import Database

```bash
# Get Aurora endpoint from CDK outputs
ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name PocDatabaseStack \
  --query "Stacks[0].Outputs[?OutputKey=='ClusterEndpoint'].OutputValue" \
  --output text)

mysql -h $ENDPOINT -u admin -p employees < employees.sql
```

### Step 5 — Store GitHub Token

```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "YOUR_GITHUB_PAT" \
  --region us-east-1
```

### Step 6 — Update Jenkins URL

In `infrastructure/lib/pipeline-stack.ts`:

```typescript
serverUrl: "https://jenkins.your-domain.com",
```

Then redeploy:

```bash
cd infrastructure && cdk deploy PocPipelineStack
```

### Step 7 — Configure Frontend

```bash
cd poc-frontend-ui
cp .env.example .env
# Set VITE_API_URL to your EB environment URL
```

### Step 8 — Push Code

```bash
git remote add origin https://github.com/Cloud-Service-Project/poc-backend-api.git
git push -u origin main
# CodePipeline auto-triggers on push
```

## Test Credentials

| User                          | Password   | Group              | Document Center |
|------------------------------|------------|--------------------|-----------------|
| hr-test@yourdomain.com       | Test@1234  | HR_Users           | ✅ Full access  |
| employee-test@yourdomain.com | Test@1234  | Standard_Employees | ❌ Denied       |

## Okta Configuration

| Field           | Value                                                                   |
|----------------|-------------------------------------------------------------------------|
| App Name        | Employee Portal PoC                                                     |
| Client ID       | `0oa12qgbqpsJsIGgc698`                                                  |
| Issuer          | `https://integrator-3623755.okta.com/oauth2/default`                   |
| Redirect URI    | `<app-origin>/login/callback`                                           |
| Scopes          | `openid profile email groups`                                           |
| Flow            | PKCE (no client secret)                                                 |
| SAML Metadata   | `https://integrator-3623755.okta.com/app/exk12qh4lb8YSNPd5698/sso/saml/metadata` |

## API Endpoints

| Method | Path                              | Auth | Description                    |
|--------|-----------------------------------|------|--------------------------------|
| GET    | `/health`                         | No   | Health check                   |
| GET    | `/api/employees`                  | Yes  | Paginated employees (6-table JOIN)|
| GET    | `/api/departments`                | Yes  | All departments                |
| GET    | `/api/documents/presigned-url`    | Yes  | S3 presigned upload/download   |
| POST   | `/api/notifications/slack`        | Yes  | Slack webhook notification     |
| GET    | `/api/social-feed`                | Yes  | 8 company social posts         |
| GET    | `/api/sfdc/contacts`              | Yes  | 10 Salesforce mock contacts    |

## GitHub Org

[https://github.com/Cloud-Service-Project](https://github.com/Cloud-Service-Project)

## RBAC Matrix

| Feature            | HR_Users | Standard_Employees | Admin  |
|--------------------|----------|-------------------|--------|
| Dashboard          | ✅       | ✅                | ✅     |
| Employees Table    | ✅       | ✅                | ✅     |
| Document Center    | ✅       | ❌                | ✅     |
| Upload Documents   | ✅       | ❌                | ✅     |
| Social Feed        | ✅       | ✅                | ✅     |
| CRM Contacts       | ✅       | ✅                | ✅     |

## Infrastructure Diagram

```
                    ┌─────────────┐
                    │   Browser   │
                    └──────┬──────┘
                           │ HTTPS
                    ┌──────▼──────┐
                    │  Okta OIDC  │
                    │  (PKCE)     │
                    └──────┬──────┘
                           │ JWT
              ┌────────────▼─────────────┐
              │   Elastic Beanstalk      │
              │   (ALB + Node.js 20)     │
              │   poc-backend-prod       │
              └──────┬──────────┬────────┘
                     │          │
          ┌──────────▼───┐  ┌───▼─────────────┐
          │  Aurora SV2  │  │    S3 Bucket     │
          │  MySQL 3.04  │  │  enterprise-hr   │
          │  (employees) │  │  -docs-poc       │
          └──────────────┘  └─────────────────┘
                     │
          ┌──────────▼───────────┐
          │   Secrets Manager    │
          │   poc/db/credentials │
          └──────────────────────┘
```
