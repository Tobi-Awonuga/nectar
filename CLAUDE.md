# Nectar — Claude Code Guide

Internal workflow and operations platform for CT Bakery.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Auth**: Microsoft SSO (Azure AD) → Nectar JWT
- **Infra**: Docker Compose + nginx reverse proxy

## Local dev

```bash
docker compose up --build
```

App runs at `http://localhost`. Use the **Dev Login** panel (Admin / Manager / Employee) on the login page — no Microsoft SSO needed locally.

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso, /autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn
