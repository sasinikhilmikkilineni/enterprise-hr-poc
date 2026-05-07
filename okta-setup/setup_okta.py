"""
Okta Automation Setup Script
Provisions groups, users, and app assignments for the Enterprise HR PoC.
"""

import asyncio
import os
import sys
from okta.client import Client as OktaClient


OKTA_ORG_URL = "https://integrator-3623755.okta.com"
APP_ID = "0oa12qgbqpsJsIGgc698"

GROUPS_TO_CREATE = ["HR_Users", "Standard_Employees", "Admin"]

USERS_TO_CREATE = [
    {
        "email": "hr-test@yourdomain.com",
        "password": "CloudHR@2025!",
        "first_name": "HR",
        "last_name": "Manager",
        "group": "HR_Users",
    },
    {
        "email": "employee-test@yourdomain.com",
        "password": "CloudHR@2025!",
        "first_name": "John",
        "last_name": "Employee",
        "group": "Standard_Employees",
    },
]


async def get_or_create_group(client, group_name):
    """Return existing group or create it."""
    params = {"q": group_name}
    groups, resp, err = await client.list_groups(params)
    if err:
        raise RuntimeError(f"Error listing groups: {err}")

    for group in groups:
        if group.profile.name == group_name:
            print(f"  [SKIP] Group '{group_name}' already exists (id={group.id})")
            return group

    group_model = {
        "profile": {
            "name": group_name,
            "description": f"Auto-provisioned group: {group_name}",
        }
    }
    new_group, _, err = await client.create_group(group_model)
    if err:
        raise RuntimeError(f"Error creating group '{group_name}': {err}")
    print(f"  [OK]   Created group '{group_name}' (id={new_group.id})")
    return new_group


async def get_or_create_user(client, user_spec):
    """Return existing user or create and activate it."""
    email = user_spec["email"]
    params = {"filter": f'profile.email eq "{email}"'}
    users, _, err = await client.list_users(params)
    if err:
        raise RuntimeError(f"Error listing users: {err}")

    for user in users:
        if user.profile.email == email:
            print(f"  [SKIP] User '{email}' already exists (id={user.id})")
            return user

    user_model = {
        "profile": {
            "firstName": user_spec["first_name"],
            "lastName": user_spec["last_name"],
            "email": email,
            "login": email,
        },
        "credentials": {
            "password": {"value": user_spec["password"]}
        },
    }
    # activate=True, sendEmail=False
    query_params = {"activate": True, "sendEmail": False}
    new_user, _, err = await client.create_user(user_model, query_params)
    if err:
        raise RuntimeError(f"Error creating user '{email}': {err}")
    print(f"  [OK]   Created user '{email}' (id={new_user.id})")
    return new_user


async def add_user_to_group(client, user, group):
    """Add user to group (idempotent — Okta returns 204 even if already member)."""
    _, err = await client.add_user_to_group(group.id, user.id)
    if err:
        raise RuntimeError(
            f"Error adding user {user.id} to group {group.id}: {err}"
        )
    print(f"  [OK]   Added '{user.profile.email}' → group '{group.profile.name}'")




async def main():
    api_token = os.environ.get("OKTA_API_TOKEN")
    if not api_token:
        print("ERROR: OKTA_API_TOKEN environment variable is not set.")
        print("       export OKTA_API_TOKEN=<your_token> and re-run.")
        sys.exit(1)

    config = {
        "orgUrl": OKTA_ORG_URL,
        "token": api_token,
    }
    client = OktaClient(config)

    print("\n═══════════════════════════════════════")
    print("  Okta Provisioning — Enterprise HR PoC")
    print("═══════════════════════════════════════\n")

    # ── Step 1: Groups ──────────────────────────────────────────────────────
    print("Step 1: Provisioning groups...")
    group_map = {}
    for group_name in GROUPS_TO_CREATE:
        group = await get_or_create_group(client, group_name)
        group_map[group_name] = group

    # ── Step 2: Users ───────────────────────────────────────────────────────
    print("\nStep 2: Provisioning users...")
    user_map = {}
    for user_spec in USERS_TO_CREATE:
        user = await get_or_create_user(client, user_spec)
        user_map[user_spec["email"]] = (user, user_spec["group"])

    # ── Step 3: Group membership ────────────────────────────────────────────
    print("\nStep 3: Assigning users to groups...")
    for email, (user, group_name) in user_map.items():
        await add_user_to_group(client, user, group_map[group_name])

    # ── Step 4: App assignment — skipped (Federation Broker Mode) ───────────
    print("\nStep 4: App assignment — MANUAL REQUIRED")
    print("  ⚠️  This app has Federation Broker Mode enabled.")
    print("     User/group assignment via API is blocked by Okta.")
    print("     See manual steps below.")

    # ── Summary ─────────────────────────────────────────────────────────────
    print("\n═══════════════════════════════════════")
    print("  Provisioning Complete — Summary")
    print("═══════════════════════════════════════\n")
    print("Test Credentials:")
    print("  ┌─────────────────────────────────┬───────────────┬────────────────────┐")
    print("  │ Email                           │ Password      │ Group              │")
    print("  ├─────────────────────────────────┼───────────────┼────────────────────┤")
    print("  │ hr-test@yourdomain.com          │ CloudHR@2025! │ HR_Users           │")
    print("  │ employee-test@yourdomain.com    │ CloudHR@2025! │ Standard_Employees │")
    print("  └─────────────────────────────────┴───────────────┴────────────────────┘")

    print("\n⚠️  MANUAL STEP REQUIRED:")
    print("   Add groups claim manually:")
    print("   Apps → Employee Portal PoC → Sign On → Edit")
    print("   → Groups claim: name=groups  filter=Matches regex  .*")
    print("   This surfaces group membership in the ID token for RBAC.\n")


if __name__ == "__main__":
    asyncio.run(main())
