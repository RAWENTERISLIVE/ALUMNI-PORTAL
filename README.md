# 🎓 Alma Connect Sphere

**Alumni–Student–Faculty Collaboration Portal**  
A secure, modular platform for students, alumni, and faculty to network, share resources, and mentor one another.

![Version](https://img.shields.io/badge/version-3.1-blue.svg)  
![Status](https://img.shields.io/badge/status-in%20development-yellow.svg)  
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## ✨ Core Features

- **Authentication & Security**  
  - JWT-based login (1 h access / 7 d refresh)  
  - Role-based access (`student`, `alumni`, `faculty`, `admin`, `super_admin`)  
  - Admission-number verification + admin approval  
  - Two-Factor Authentication (TOTP)  
  - Rate-limiting & CAPTCHA on auth endpoints  

- **Profiles & Connections**  
  - Rich user profiles (photo, bio, skills, “Open to Mentor”)  
  - Privacy controls per section (public/alumni/connections)  
  - Send/accept connection requests → “Connections-Only” feed  

- **Social Feed & Posts**  
  - Rich-media posts (text, images, PDFs ≤ 50 MB)  
  - Audience selector: Public ∣ Alumni ∣ Students ∣ Connections ∣ Groups  
  - Reactions & nested comments with real-time updates  
  - Flag & report content → admin moderation queue  

- **Groups & Events**  
  - Public/private groups by interest or class year  
  - Join/leave workflows with group-admin approval  
  - Group feed + events calendar  
  - Category-color themes and custom icons  

- **Job Board**  
  - Post & browse listings (title, company, location, type, deadline)  
  - Filters by keyword, location, category, alumni-employer  
  - Apply (resume upload) & save jobs  
  - Admin review queue  

- **Mentorship Hub**  
  - Mentor directory (expertise, industry, location)  
  - Request/accept workflow → private chat + scheduler  
  - Calendar integration (Google/Outlook)  
  - Session feedback & rating  

- **File Storage (Local Server)**  
  - **Multer** + disk-storage strategy → `/uploads/` directory on host  
  - Automatic directory creation at startup  
  - Secure filename sanitization and file-type validation  
  - Dev vs. Prod config (environment variable: `UPLOADS_DIR`)  
  - Cleanup scripts for orphaned files  

- **Settings & Notifications**  
  - Account: email, password, 2FA, data export/deletion  
  - Notification prefs: email/push for likes, comments, jobs, mentions  
  - Digest emails: daily/weekly activity summaries  

- **Admin & Analytics**  
  - User management: approve, suspend, delete, role assignment  
  - Content moderation: flagged posts/groups/jobs  
  - Site config: feature toggles, branding, email templates  
  - Audit logs & analytics dashboard (DAU, sign-ups, posts, job apps)

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 16  
- MongoDB ≥ 4.4  
- npm 

### Installation

1. **Clone repository**  
   ```bash
   git clone https://github.com/your-org/alma-connect-sphere.git
   cd alma-connect-sphere
````

2. **Install dependencies**

   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Configure environment**

   * **backend/.env**

     ```env
     PORT=5000
     MONGODB_URI=your-mongo-url
     JWT_SECRET=your-jwt-secret
     JWT_REFRESH_SECRET=your-refresh-secret
     UPLOADS_DIR=./uploads
     NODE_ENV=development
     ```
   * **frontend/.env**

     ```env
     VITE_API_URL=http://localhost:5000/api
     ```

4. **Prepare uploads directory**

   ```bash
   mkdir -p ./backend/uploads
   ```

5. **Run in development**

   ```bash
   npm run dev:full
   ```

   * Frontend → [http://localhost:8080](http://localhost:8080)
   * Backend API → [http://localhost:5000/api](http://localhost:5000/api)

---

## 🛠️ Technology Stack

| Layer      | Technology                               |
| ---------- | ---------------------------------------- |
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS |
| Backend    | Node.js, Express.js, TypeScript, MongoDB |
| File Store | Multer (diskStorage)                     |
| Auth       | JWT, bcryptjs, TOTP (speakeasy)          |
| Validation | express-validator                        |
| DevOps     | Docker, GitHub Actions, ESLint, Prettier |

---

## 🔧 Scripts

```bash
# Start both services
npm run dev:full

# Frontend
npm run dev       # Vite
npm run build     # Production build

# Backend
cd backend
npm run dev       # nodemon
npm run build     # Compile TS
npm start         # Production server
```

---

## 📦 Deployment

1. **Build**

   ```bash
   cd frontend && npm run build
   cd ../backend && npm run build
   ```
2. **Configure** production `.env` (point `UPLOADS_DIR` to persistent storage)
3. **Start** via PM2, Docker, or your host’s process manager
4. **Serve** static `/uploads` folder (e.g. with Nginx) under `/media/` endpoint

---

## 🤝 Contributing

1. Fork & clone
2. Create branch (`feature/…`)
3. Commit & push
4. Open PR
5. Ensure tests pass & docs updated

---

## 📄 License

MIT © Your Organization

```
```
