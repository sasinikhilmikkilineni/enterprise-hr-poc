# poc-backend-api — Enterprise HR PoC Backend

Express.js REST API secured with Okta JWT validation, backed by Aurora Serverless v2 MySQL, S3 presigned URLs, and Secrets Manager credential injection.

## Stack

| Layer       | Technology                         |
|-------------|-----------------------------------|
| Runtime     | Node.js 20 (LTS)                  |
| Framework   | Express 4                         |
| Auth        | Okta JWT Verifier (OIDC)          |
| Database    | Aurora Serverless v2 MySQL (mysql2)|
| Storage     | AWS S3 (presigned URLs)           |
| Secrets     | AWS Secrets Manager               |
| Deployment  | Elastic Beanstalk (Node.js 20 AL2023)|

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env — set AWS credentials or use an IAM role if on EC2

# 3. Start server
npm start
# or with hot-reload
npm run dev
```

Server starts at `http://localhost:3001`

## Endpoints

| Method | Path                                | Auth | Description                     |
|--------|-------------------------------------|------|---------------------------------|
| GET    | `/health`                           | No   | Health check                    |
| GET    | `/api/employees`                    | Yes  | Paginated employee list         |
| GET    | `/api/departments`                  | Yes  | All departments                 |
| GET    | `/api/documents/presigned-url`      | Yes  | S3 presigned upload/download    |
| POST   | `/api/notifications/slack`          | Yes  | Slack webhook notification      |
| GET    | `/api/social-feed`                  | Yes  | Company social feed (8 posts)   |
| GET    | `/api/sfdc/contacts`                | Yes  | Salesforce mock contacts        |

### Pagination — `/api/employees`

```
GET /api/employees?page=1&limit=50
```

### Presigned URLs — `/api/documents/presigned-url`

```
# Upload
GET /api/documents/presigned-url?filename=report.pdf&action=upload

# Download
GET /api/documents/presigned-url?filename=report.pdf&action=download
```

## Authentication

All `/api/*` routes require a valid Okta access token:

```
Authorization: Bearer <access_token>
```

The JWT is verified against:
- Issuer: `https://integrator-3623755.okta.com/oauth2/default`
- Audience: `api://default`
- Client ID: `0oa12qgbqpsJsIGgc698`

## AWS Secrets Manager Schema

The secret `poc/db/credentials` must contain:

```json
{
  "host": "your-aurora-cluster-endpoint",
  "username": "admin",
  "password": "...",
  "dbname": "employees",
  "port": 3306
}
```

## Deployment to Elastic Beanstalk

```bash
# Package (excluding node_modules and git)
zip -r artifact.zip . -x "*.git*" "node_modules/*"

# Upload via AWS Console or CLI
aws elasticbeanstalk create-application-version \
  --application-name poc-enterprise-app \
  --version-label v1.0.0 \
  --source-bundle S3Bucket=<your-bucket>,S3Key=artifact.zip

aws elasticbeanstalk update-environment \
  --environment-name poc-backend-prod \
  --version-label v1.0.0
```

The EB environment is configured via `.ebextensions/nodecommand.config` to run `npm start`.

## Environment Variables on Beanstalk

Set these in the EB Console under **Configuration → Software**:

```
OKTA_ISSUER        = https://integrator-3623755.okta.com/oauth2/default
OKTA_CLIENT_ID     = 0oa12qgbqpsJsIGgc698
AWS_REGION         = us-east-1
AWS_SECRET_NAME    = poc/db/credentials
S3_BUCKET          = enterprise-hr-docs-poc
NODE_ENV           = production
```
