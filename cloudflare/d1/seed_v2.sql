
-- Enterprise Seed Data for MPSAJMER CONNECT
PRAGMA foreign_keys = ON;

-- 1. Users
INSERT INTO users (id, email, password, name, role, status, is_verified, admission_number, admission_year, first_name, last_name, bio, graduation_year, class_year) VALUES 
('admin-1', 'mpsajmer123@gmail.com', '$2a$10$CQKasBLfC0Bwm93oEen./.Pn/X/vWSqWW1hqjMOYR8pSj1K/a34r.', 'MPS AJMER ADMIN', 'SUPER_ADMIN', 'ACTIVE', 1, 'ADMIN001', '2023', 'MPS', 'ADMIN', 'Official administrator for MPSAJMER CONNECT platform.', 2023, 2023),
('admin-2', 'futurist.raghav@gmail.com', '$2a$10$CQKasBLfC0Bwm93oEen./.Pn/X/vWSqWW1hqjMOYR8pSj1K/a34r.', 'Raghav Agarwal', 'SUPER_ADMIN', 'ACTIVE', 1, 'ALUM001', '2015', 'Raghav', 'Agarwal', 'Lead Developer and Alumni of MPS Ajmer. Always looking to innovate.', 2015, 2015),
('user-1', 'alumni.demo@example.com', '$2a$10$CQKasBLfC0Bwm93oEen./.Pn/X/vWSqWW1hqjMOYR8pSj1K/a34r.', 'Jane Smith', 'USER', 'ACTIVE', 1, 'ALUM002', '2018', 'Jane', 'Smith', 'Software Engineer at Google. Class of 2018.', 2018, 2018);

-- 2. Posts
INSERT INTO posts (id, title, content, author_id, category, is_featured, is_school_update, visibility) VALUES 
('post-1', 'Welcome to MPSAJMER CONNECT', 'We are thrilled to launch the new alumni portal. Connect, share, and grow with your fellow alumni!', 'admin-1', 'announcement', 1, 1, 'public'),
('post-2', 'Class of 2015 Reunion', 'Its been 10 years! Let''s celebrate our journey together this summer at the main campus.', 'admin-2', 'event', 1, 0, 'public'),
('post-3', 'Tips for Career Growth', 'Sharing some insights on how to navigate the tech industry after graduation.', 'user-1', 'career', 0, 0, 'public');

-- 3. Jobs
INSERT INTO jobs (id, title, company, location, type, posted_by_id, posted_by_name, description, salary_range_min, salary_range_max) VALUES 
('job-1', 'Senior Software Engineer', 'Google', 'Mountain View, CA', 'full-time', 'user-1', 'Jane Smith', 'Looking for experienced developers to join our Cloud team. Alumni referral available!', 150000, 250000),
('job-2', 'Data Analyst', 'Microsoft', 'Remote', 'full-time', 'admin-2', 'Raghav Agarwal', 'Joining the AI research group. Great opportunity for recent graduates.', 100000, 160000);

-- 4. Events
INSERT INTO events (id, title, description, date, time, location, organizer_id, category, is_school_event) VALUES 
('event-1', 'Annual Alumni Meet 2026', 'The biggest gathering of the year. Join us for dinner and networking.', '2026-12-15T18:00:00Z', '6:00 PM', 'MPS Main Campus Hall', 'admin-1', 'meetup', 1),
('event-2', 'Tech Webinar: Future of AI', 'A virtual session with industry experts on how AI is changing the world.', '2026-05-20T14:00:00Z', '2:00 PM', 'Zoom', 'admin-2', 'webinar', 0);

-- 5. Notifications
INSERT INTO notifications (id, user_id, title, message, type) VALUES 
('notif-1', 'admin-2', 'New Job Posted', 'Jane Smith posted a new job: Senior Software Engineer at Google', 'job'),
('notif-2', 'user-1', 'Welcome!', 'Welcome to the MPSAJMER CONNECT platform, Jane!', 'info');
