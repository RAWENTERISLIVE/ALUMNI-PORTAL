-- Enterprise Seed Data for MPSAJMER CONNECT

-- Insert some more users
INSERT INTO users (id, email, password, name, role, is_verified, status, created_at, updated_at) VALUES 
('user_3', 'alumni1@example.com', '$2b$10$VguOQaRfGyVjvkPPvrGu7uWslK4eBIWAeqVZJLoOaIirIlXM.RuG2', 'John Doe', 'ALUMNI', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user_4', 'alumni2@example.com', '$2b$10$VguOQaRfGyVjvkPPvrGu7uWslK4eBIWAeqVZJLoOaIirIlXM.RuG2', 'Jane Smith', 'ALUMNI', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user_5', 'student1@example.com', '$2b$10$VguOQaRfGyVjvkPPvrGu7uWslK4eBIWAeqVZJLoOaIirIlXM.RuG2', 'Bob Wilson', 'STUDENT', 1, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert some posts
INSERT INTO posts (id, author_id, content, type, status, created_at, updated_at) VALUES 
('post_1', 'superadmin-1', 'Welcome to the new MPSAJMER CONNECT portal! We are excited to have you all here.', 'ANNOUNCEMENT', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('post_2', 'superadmin-2', 'Great to see the community growing. Feel free to share your achievements here.', 'GENERAL', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('post_3', 'user_3', 'Looking for internship opportunities in Web Development. Any leads?', 'HELP_WANTED', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert some jobs
INSERT INTO jobs (id, poster_id, title, company, location, type, description, status, created_at, updated_at) VALUES 
('job_1', 'superadmin-1', 'Senior Software Engineer', 'Google', 'Remote', 'FULL_TIME', 'Looking for experienced devs...', 'OPEN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('job_2', 'user_4', 'Product Designer', 'Airbnb', 'New York, NY', 'FULL_TIME', 'Design the future of travel...', 'OPEN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert some events
INSERT INTO events (id, organizer_id, title, description, location, date, type, status, created_at, updated_at) VALUES 
('event_1', 'superadmin-1', 'Annual Alumni Meet 2024', 'Join us for our annual get-together.', 'School Auditorium', '2024-12-25T10:00:00Z', 'REUNION', 'UPCOMING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('event_2', 'superadmin-2', 'Tech Webinar: AI in 2024', 'A talk by industry experts.', 'Zoom', '2024-05-20T15:00:00Z', 'WEBINAR', 'UPCOMING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert some notifications for admin
INSERT INTO notifications (id, recipient_id, actor_id, type, target_id, target_type, content, is_read, created_at) VALUES 
('notif_1', 'superadmin-1', 'user_3', 'POST_LIKE', 'post_1', 'POST', 'John Doe liked your post', 0, CURRENT_TIMESTAMP),
('notif_2', 'superadmin-1', 'user_4', 'COMMENT', 'post_1', 'POST', 'Jane Smith commented on your post', 0, CURRENT_TIMESTAMP);
