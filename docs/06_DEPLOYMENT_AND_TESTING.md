# 6. Deployment & Testing Guide

## 1. Deployment Runbook

### Environment Configurations
Crucial files mapping runtime executions depend strongly upon root environment declarations. Provide `.env` locally or within the hosting provider's secret vault:
```env
# Frontend
VITE_API_URL=https://api.yourdomain.com/api

# Backend
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=super_secret_string
JWT_REFRESH_SECRET=super_secret_refresh_string
PORT=5000
```

### Build & Ship (Hostinger / cPanel Example)
The frontend application executes purely within a native SPA architecture. 

1. **Local Build**:
    ```bash
    npm run build
    ```
2. **Uploading**: 
    Move purely the contents of the generated `dist/` directory securely into `public_html/`.
3. **Routing Resolution via HTTP servers (Apache `.htaccess`)**:
    React Router requires standard 404 fallbacks natively looping back into `index.html` allowing dynamic pathing resolving purely on the client.
    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /
      RewriteRule ^index\.html$ - [L]
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule . /index.html [L]
    </IfModule>
    ```

### Backend Containerization
The current backend ecosystem utilizes full strict Docker deployments running via `docker-compose.yml` defining Node execution contexts tracking perfectly aligned Postgres images.

---

## 2. Integrated Testing Ecosystem

The application leverages Python-based TestSprite execution frameworks for heavy automated behavior validations mapped natively inside the `/testsprite_tests/` directory natively running multiple verification suites.

### Testing Standard Playbook
1. Ensure the PostgreSQL container is dynamically operating natively alongside the Node API.
2. Initialize testing contexts utilizing native shell wrappers located within the root directory (e.g., `./test-integration.sh`, `./test-registration.sh`).
3. Core Backend validation encompasses exhaustive arrays encompassing:
   - `TC001_verify_user_registration_with_valid_and_invalid_data.py`
   - `TC002_verify_user_login_with_correct_and_incorrect_credentials.py`
   - `TC003_verify_access_token_refresh_functionality.py`
   - Standard administrative bounds testing user iteration (`TC009`, `TC010`).
4. Output matrices natively generate standardized HTML metric tracking dashboards (`testsprite-mcp-test-report.html`) dynamically representing execution health.
