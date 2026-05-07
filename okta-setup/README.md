# Okta Setup — Enterprise HR PoC

This script automates provisioning of Okta groups, users, and application assignments for the Enterprise HR PoC.

## What It Does

1. Creates three groups: `HR_Users`, `Standard_Employees`, `Admin`
2. Creates two test users (skips if they already exist, activates immediately, no email)
3. Assigns each user to their group
4. Assigns both users to the Okta application (`0oa12qgbqpsJsIGgc698`)
5. Prints a summary table and the one required manual step

## Prerequisites

- Python 3.8+
- An Okta API token with sufficient permissions (see below)

## How to Get an Okta API Token

1. Log in to your Okta Admin Console: [https://integrator-3623755.okta.com/admin](https://integrator-3623755.okta.com/admin)
2. Navigate to **Security → API → Tokens**
3. Click **Create Token**
4. Give it a name (e.g., `poc-setup-token`)
5. Copy the token — it is shown only once

## Running the Script

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set the API token
export OKTA_API_TOKEN=<your_token_here>

# 3. Run the provisioner
python setup_okta.py
```

## Required Manual Step (After Script)

The script cannot configure claims via the Okta API — this must be done manually:

1. Go to **Okta Admin → Applications → Employee Portal PoC**
2. Click the **Sign On** tab
3. Click **Edit** in the OpenID Connect ID Token section
4. Under **Group claim type**, select **Filter**
5. Set:
   - **Claim name:** `groups`
   - **Filter:** `Matches regex` → `.*`
6. Click **Save**

This ensures group membership is included in the ID token so the frontend can perform RBAC (e.g., restricting Document Center to `HR_Users`).

## Security: Revoke Token After Setup

Once provisioning is complete, revoke the API token to minimize attack surface:

1. Go to **Security → API → Tokens**
2. Find your token and click **Revoke**

## Test Credentials

| Email                          | Password   | Group              | Access Level          |
|-------------------------------|------------|--------------------|----------------------|
| hr-test@yourdomain.com        | Test@1234  | HR_Users           | Full access + Docs   |
| employee-test@yourdomain.com  | Test@1234  | Standard_Employees | Limited (no Docs)    |

## Okta Application Details

| Field         | Value                                                        |
|---------------|--------------------------------------------------------------|
| App Name      | Employee Portal PoC                                          |
| Client ID     | `0oa12qgbqpsJsIGgc698`                                       |
| Issuer        | `https://integrator-3623755.okta.com/oauth2/default`        |
| SAML Metadata | `https://integrator-3623755.okta.com/app/exk12qh4lb8YSNPd5698/sso/saml/metadata` |
