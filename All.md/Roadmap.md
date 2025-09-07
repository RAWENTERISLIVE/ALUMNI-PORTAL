# Alumni-Student-Faculty Collaboration Portal  
A precise, section-wise feature breakdown with sub-functions, module connections, and a phase-wise roadmap—including a status tracker table for timely updates.

---

## 1. Core Authentication & Security  
1. **Registration Paths**  
   - **Standard**: email + password + admission number (`501/YY`) → “pending”  
   - **Manual**: email + detailed form (ID upload, year, dept.) → admin approval  
   - **Super-Admin**: hard-coded emails → immediate active  
2. **Login Flow**  
   - Email/password + status check → JWT access (1 h) & refresh (7 d) tokens  
   - Role-based redirect (student → Feed, admin → Dashboard)  
3. **Password Management**  
   - Bcrypt hashing; reset via secure email token  
4. **RBAC Enforcement**  
   - Middleware/UI guards; hide forbidden buttons  
5. **API Protection**  
   - Rate-limit, input validation, TLS  

> **Module Connections:**  
> - All modules request `currentUser` & roles; tokens attached to API calls enforce permissions.

---

## 2. Home Feed  
1. **Feed Aggregation**  
   - Pull from: Connections • Groups • Pinned announcements • Job highlights  
2. **Post Actions**  
   - Like • Comment • Share • Bookmark → Posts module  
3. **Filters & Tabs**: All ∣ Connections ∣ Groups ∣ Jobs ∣ Events  
4. **Real-Time Updates**: WebSocket for new comments/likes  
5. **Admin Overrides**: Super-Admin can pin/remove posts  

> **Module Connections:**  
> - **Posts** supplies items; **Groups** & **Job Board** inject entries; **Admin** can feature content.

---

## 3. Profile & Connections  
1. **User Profile**  
   - Photo, bio, batch, dept., role, skills, “Open to Mentor” toggle  
   - Privacy per section: public / alumni / connections  
2. **Edit Profile**: inline forms → Profile API  
3. **Connections**  
   - Send/accept requests → mutual unlocks “Connections-Only” feed  
4. **Suggestions**: algorithmic by batch/dept./groups  

> **Module Connections:**  
> - **Home Feed**, **Posts**, **Mentorship** respect privacy & connections.

---

## 4. Posts  
1. **Create Post**  
   - Rich editor (text)  
   - Audience: Public ∣ teacher(faculty) ∣ Connections
2. **Detail View**: nested comments, linkedin reactions  
3. **Comment & Reactions**: inline reply/edit/delete  
4. **Reporting** → Admin moderation queue  
5. **Data Flow**: Posts API → DB → real-time feed broadcasts  

> **Module Connections:**  
> - Audience settings drive feed visibility; Admin moderation via **Admin API**.

---

## 5. Groups  
1. **Directory**: public groups + search/filter  
2. **Join/Leave**: immediate (public) or pending (private)  
3. **Group Feed**: scoped posts/events → optional Home Feed inclusion  
4. **Group Admin Tools**: approve requests, moderate posts  
5. **Settings**: visibility, description, category icon/color  

> **Module Connections:**  
> - **Posts** target groups; **Home Feed** surfaces group content; **Mentorship** can leverage group circles.

---

## 6. Job Board  
1. **Job Listing**: title, company, location, type, deadline, details  
2. **Search & Filters**: keyword, location, category, alumni-employer  
3. **Apply/Save**: resume upload → Application API; save to Profile  
4. **Notifications**: alerts by skill match  
5. **Admin Review**: pending jobs queue  

> **Module Connections:**  
> - **Home Feed** highlights new jobs; **Profile** skills power matching.

---

## 7. Alumni Mentorship  
1. **Mentor Directory**: filter by expertise, industry, location  
2. **Request Flow**: send → mentor dashboard → accept → Conversation  
3. **Session Scheduler**: calendar UI (Google/Outlook integration)  
4. **Feedback**: ratings stored for Admin oversight  
5. **Program Dashboard** (Admin): active pairings, response times  

> **Module Connections:**  
> - **Directory** reuse; **Messaging** backend powers chat; **Events** for group panels.

---

## 8. Alumni Directory  
1. **Search & Filter**: name, batch, company, location, skills  
2. **Results View**: cards/grids with “Connect” / “Message”  
3. **Map View** (optional): plot locations  
4. **Saved Searches**: reusable filters for outreach  

> **Module Connections:**  
> - Opens **Profile**; launches **Connections** & **Messaging**.

---

## 9. Settings  
1. **Account**: email, password, 2FA toggle  
2. **Privacy & Notifications**: email/push controls  
3. **Data & Export**: download data (GDPR/FERPA), deactivate  
4. **Localization & Accessibility**  

> **Module Connections:**  
> - Affects visibility in **Directory**, **Feed**, **Mentorship**.

---

## 10. Admin & Analytics  
1. **User Management**: approve/reject/suspend/delete; role assignment  
2. **Content Moderation**: flagged posts/groups/jobs → review  
3. **Site Config**: feature toggles, branding, email templates  
4. **Audit Logs**: chronological admin action records  
5. **Analytics Dashboard**: DAUs, sign-ups, posts, job apps, mentorships  

> **Module Connections:**  
> - Elevated-permission APIs; reads aggregated metrics from all modules.

---

## Phase-Wise Roadmap & Status Tracker

| Phase | Focus                        | Deliverables                                                          | Status         | Last Updated | Remarks                    |
|:-----:|:-----------------------------|:----------------------------------------------------------------------|:---------------|:-------------|:---------------------------|
| 1     | Secure Core & Profiles       | • Auth & RBAC<br>• Registration + approval<br>• Profile CRUD<br>• Directory search<br>• Super-Admin mgmt | ✅ Completed    | June 23, 2025 | Strong foundation ready for Phase 2 |
| 2     | Social & Content             | • Connections<br>• Home Feed MVP<br>• Posts (CRUD+comments)<br>• Reporting & moderation | Ready to Start    | —            | Phase 1 foundation supports this |
| 3     | Community Groups, Career & Mentorship   | • Group creation/join<br>• Group feed<br>• Group admin tools<br>•  • Job Board MVP<br>• Mentorship directory & requests<br>• Basic chat<br>• Notifications| Not Started    | —            |                            |
| 4     | Admin Console & Analytics    | • Full Admin panel<br>• Audit logs<br>• Site settings<br>• Analytics charts | Partially Done    | —            | Basic admin panel exists |
| 5    | Polish & Advanced Features   | • Real-time chat<br>• Calendar integration<br>• AI suggestions<br>• Mobile PWA | Not Started    | —            |                            |

> **Usage:**  
> - **Status**: update to _In Progress_ or _Completed_ as work proceeds.  
> - **Last Updated**: date of most recent change.  
> - **Remarks**: notes on blockers or dependencies.  

---
