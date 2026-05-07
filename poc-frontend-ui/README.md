# poc-frontend-ui — Enterprise HR PoC Frontend

React + Vite + Tailwind CSS single-page application secured with Okta OIDC (PKCE). Provides a full enterprise-grade HR portal with Dashboard, Employees, Document Center, Social Feed, and CRM Contacts.

## Stack

| Layer       | Technology                        |
|-------------|----------------------------------|
| Framework   | React 18 + Vite 5                |
| Routing     | React Router v6                  |
| Auth        | Okta React SDK + okta-auth-js    |
| Styling     | Tailwind CSS v3                  |
| HTTP Client | Axios                            |
| Icons       | lucide-react                     |
| Upload      | react-dropzone                   |

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Set VITE_API_URL to your backend URL

# 3. Start dev server
npm run dev
```

App runs at `http://localhost:5173`

## Pages

| Route         | Page            | Auth | RBAC                      |
|---------------|-----------------|------|---------------------------|
| `/dashboard`  | Dashboard       | Yes  | All users                 |
| `/employees`  | Employees       | Yes  | All users                 |
| `/documents`  | Document Center | Yes  | HR_Users, Admin only      |
| `/social`     | Social Feed     | Yes  | All users                 |
| `/crm`        | CRM Contacts    | Yes  | All users                 |

## Okta Configuration

| Field        | Value                                                       |
|--------------|-------------------------------------------------------------|
| Client ID    | `0oa12qgbqpsJsIGgc698`                                      |
| Issuer       | `https://integrator-3623755.okta.com/oauth2/default`       |
| Redirect URI | `<origin>/login/callback`                                   |
| Scopes       | `openid profile email groups`                              |
| Flow         | PKCE (no client secret required)                           |

**Important:** The `groups` scope requires a custom Groups claim to be configured in Okta:
- Apps → Employee Portal PoC → Sign On → Edit
- Groups claim: name=`groups`, filter=`Matches regex`, value=`.*`

## Building for Production

```bash
npm run build
# Output: dist/
```

## Environment Variables

| Variable      | Description                          | Default                  |
|---------------|--------------------------------------|--------------------------|
| `VITE_API_URL`| Backend API base URL                 | `http://localhost:3001`  |

## Deployment

The Jenkinsfile runs `npm run build` and packages `dist/` into `artifact.zip` for deployment to Elastic Beanstalk or S3 static hosting.
