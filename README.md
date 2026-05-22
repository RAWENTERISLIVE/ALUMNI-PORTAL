# 🎓 Alma Connect Sphere

**Alumni–Student–Faculty Collaboration Portal**  
A secure, modular platform for students, alumni, and faculty to network, share resources, and mentor one another.

![Version](https://img.shields.io/badge/version-3.1-blue.svg)  
![Status](https://img.shields.io/badge/status-in%20development-yellow.svg)  
![License](https://img.shields.io/badge/license-MIT-green.svg)

---
Deployed Website: https://mpsajmer.raghavagarwal.com/
Test Credentials:
Email: test@admin.com
Password: Admin@123
Website Screenshots: [https://drive.google.com/drive/folders/1px8VhWWFlGz1Z8YAAIzHErHgjhKm9AYl?usp=sharing](https://drive.google.com/drive/folders/1px8VhWWFlGz1Z8YAAIzHErHgjhKm9AYl?usp=sharing)

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
## 📄 License

MIT © RAGHAV AGARWAL
[https://raghavagarwal.com/](https://raghavagarwal.com)

```
```
