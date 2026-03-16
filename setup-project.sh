#!/usr/bin/env bash
set -e

echo "Scaffolding Nectar project..."
echo ""

# ─────────────────────────────────────────────────────────────
# GITHUB ACTIONS
# ─────────────────────────────────────────────────────────────
mkdir -p .github/workflows

touch .github/workflows/ci.yml
touch .github/workflows/build.yml

# ─────────────────────────────────────────────────────────────
# BACKEND
# ─────────────────────────────────────────────────────────────
mkdir -p backend/src/config
mkdir -p backend/src/controllers
mkdir -p backend/src/middleware
mkdir -p backend/src/models
mkdir -p backend/src/routes
mkdir -p backend/src/services
mkdir -p backend/src/types
mkdir -p backend/src/utils

# config
touch backend/src/config/database.ts
touch backend/src/config/auth.ts
touch backend/src/config/env.ts

# controllers
touch backend/src/controllers/auth.controller.ts
touch backend/src/controllers/users.controller.ts
touch backend/src/controllers/workflows.controller.ts
touch backend/src/controllers/tasks.controller.ts
touch backend/src/controllers/approvals.controller.ts
touch backend/src/controllers/notifications.controller.ts
touch backend/src/controllers/audit.controller.ts

# middleware
touch backend/src/middleware/auth.middleware.ts
touch backend/src/middleware/rbac.middleware.ts
touch backend/src/middleware/error.middleware.ts
touch backend/src/middleware/logger.middleware.ts
touch backend/src/middleware/validate.middleware.ts

# models
touch backend/src/models/user.model.ts
touch backend/src/models/workflow.model.ts
touch backend/src/models/task.model.ts
touch backend/src/models/approval.model.ts
touch backend/src/models/notification.model.ts
touch backend/src/models/audit.model.ts

# routes
touch backend/src/routes/index.ts
touch backend/src/routes/auth.routes.ts
touch backend/src/routes/users.routes.ts
touch backend/src/routes/workflows.routes.ts
touch backend/src/routes/tasks.routes.ts
touch backend/src/routes/approvals.routes.ts
touch backend/src/routes/notifications.routes.ts
touch backend/src/routes/audit.routes.ts

# services
touch backend/src/services/auth.service.ts
touch backend/src/services/users.service.ts
touch backend/src/services/workflows.service.ts
touch backend/src/services/tasks.service.ts
touch backend/src/services/approvals.service.ts
touch backend/src/services/notifications.service.ts
touch backend/src/services/audit.service.ts

# types
touch backend/src/types/express.d.ts
touch backend/src/types/domain.types.ts

# utils
touch backend/src/utils/logger.ts
touch backend/src/utils/pagination.ts

# entry point
touch backend/src/app.ts

# backend root
touch backend/Dockerfile
touch backend/Dockerfile.dev
touch backend/tsconfig.json

cat > backend/package.json << 'EOF'
{
  "name": "nectar-backend",
  "version": "0.1.0",
  "private": true
}
EOF

cat > backend/.env.example << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://nectar:nectar@postgres:5432/nectar
JWT_SECRET=
AZURE_CLIENT_ID=
AZURE_TENANT_ID=
AZURE_CLIENT_SECRET=
EOF

# ─────────────────────────────────────────────────────────────
# FRONTEND
# ─────────────────────────────────────────────────────────────
mkdir -p frontend/public
mkdir -p frontend/src/components/ui
mkdir -p frontend/src/components/layout
mkdir -p frontend/src/components/shared
mkdir -p frontend/src/context
mkdir -p frontend/src/design-system
mkdir -p frontend/src/hooks
mkdir -p frontend/src/lib
mkdir -p frontend/src/pages/auth
mkdir -p frontend/src/pages/dashboard
mkdir -p frontend/src/pages/workflows
mkdir -p frontend/src/pages/tasks
mkdir -p frontend/src/pages/approvals
mkdir -p frontend/src/pages/audit
mkdir -p frontend/src/pages/admin
mkdir -p frontend/src/services
mkdir -p frontend/src/types
mkdir -p frontend/src/utils

# public
touch frontend/public/favicon.ico

# components/layout
touch frontend/src/components/layout/AppShell.tsx
touch frontend/src/components/layout/Sidebar.tsx
touch frontend/src/components/layout/Header.tsx
touch frontend/src/components/layout/PageContainer.tsx

# components/shared
touch frontend/src/components/shared/DataTable.tsx
touch frontend/src/components/shared/StatusBadge.tsx
touch frontend/src/components/shared/LoadingSpinner.tsx

# context
touch frontend/src/context/AuthContext.tsx
touch frontend/src/context/NotificationContext.tsx

# design-system
touch frontend/src/design-system/tokens.css
touch frontend/src/design-system/globals.css
touch frontend/src/design-system/theme.ts

# hooks
touch frontend/src/hooks/useAuth.ts
touch frontend/src/hooks/usePermissions.ts
touch frontend/src/hooks/useNotifications.ts
touch frontend/src/hooks/usePagination.ts

# lib (required by shadcn)
touch frontend/src/lib/utils.ts

# pages
touch frontend/src/pages/auth/LoginPage.tsx
touch frontend/src/pages/dashboard/DashboardPage.tsx
touch frontend/src/pages/workflows/WorkflowsPage.tsx
touch frontend/src/pages/workflows/WorkflowDetailPage.tsx
touch frontend/src/pages/tasks/TasksPage.tsx
touch frontend/src/pages/approvals/ApprovalsPage.tsx
touch frontend/src/pages/audit/AuditLogPage.tsx
touch frontend/src/pages/admin/AdminPage.tsx

# services
touch frontend/src/services/api.client.ts
touch frontend/src/services/auth.service.ts
touch frontend/src/services/workflows.service.ts
touch frontend/src/services/tasks.service.ts
touch frontend/src/services/notifications.service.ts

# types
touch frontend/src/types/domain.types.ts

# utils
touch frontend/src/utils/formatters.ts
touch frontend/src/utils/permissions.ts

# app
touch frontend/src/App.tsx
touch frontend/src/main.tsx
touch frontend/src/router.tsx

# frontend root
touch frontend/tailwind.config.ts
touch frontend/tsconfig.json
touch frontend/vite.config.ts
touch frontend/Dockerfile
touch frontend/Dockerfile.dev

cat > frontend/package.json << 'EOF'
{
  "name": "nectar-frontend",
  "version": "0.1.0",
  "private": true
}
EOF

cat > frontend/.env.example << 'EOF'
VITE_API_BASE_URL=/api
EOF

# shadcn registry config
cat > frontend/components.json << 'EOF'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/design-system/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
EOF

# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────
mkdir -p database/migrations
mkdir -p database/seeds

touch database/migrations/001_create_users.sql
touch database/migrations/002_create_roles.sql
touch database/migrations/003_create_workflows.sql
touch database/migrations/004_create_tasks.sql
touch database/migrations/005_create_approvals.sql
touch database/migrations/006_create_notifications.sql
touch database/migrations/007_create_audit_logs.sql

touch database/seeds/001_seed_roles.sql

# ─────────────────────────────────────────────────────────────
# NGINX
# ─────────────────────────────────────────────────────────────
mkdir -p nginx/conf.d

touch nginx/nginx.conf
touch nginx/conf.d/nectar.conf

# ─────────────────────────────────────────────────────────────
# SCRIPTS
# ─────────────────────────────────────────────────────────────
mkdir -p scripts

touch scripts/deploy.sh
touch scripts/rollback.sh

chmod +x scripts/deploy.sh
chmod +x scripts/rollback.sh

# ─────────────────────────────────────────────────────────────
# ROOT FILES
# ─────────────────────────────────────────────────────────────
touch docker-compose.yml
touch docker-compose.dev.yml

cat > .env.example << 'EOF'
# Postgres
POSTGRES_USER=nectar
POSTGRES_PASSWORD=nectar
POSTGRES_DB=nectar

# Backend
NODE_ENV=development
JWT_SECRET=

# Azure / Microsoft SSO
AZURE_CLIENT_ID=
AZURE_TENANT_ID=
AZURE_CLIENT_SECRET=
EOF

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment files
.env
.env.local
.env.*.local

# Build output
dist/
build/
.next/
out/

# TypeScript
*.tsbuildinfo

# Logs
logs/
*.log
npm-debug.log*

# Docker
.docker/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Postgres data volume (if mounted locally)
postgres-data/
EOF

cat > README.md << 'EOF'
# Nectar

Internal workflow and operations platform.

## Local development

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Access via: http://nectar.ct.applications
EOF

# ─────────────────────────────────────────────────────────────
# DONE
# ─────────────────────────────────────────────────────────────
echo "Project structure created."
echo ""
echo "  frontend/       React + TypeScript + shadcn/ui"
echo "  backend/        Node.js + Express + TypeScript"
echo "  database/       PostgreSQL migrations and seeds"
echo "  nginx/          Reverse proxy configuration"
echo "  scripts/        Deployment and ops scripts"
echo "  .github/        CI/CD workflows"
echo ""
echo "Next: scaffold the backend service."
