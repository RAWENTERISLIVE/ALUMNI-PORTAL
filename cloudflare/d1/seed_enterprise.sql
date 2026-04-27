-- Enterprise Seed Script for MPSAJMER CONNECT (Aligned with 0007_auth.sql)
-- Adding Super Admins
INSERT INTO users (
    id, email, password, name, role, status, 
    account_type, is_verified, created_at, updated_at
) VALUES 
(
    'superadmin-1', 
    'mpsajmer123@gmail.com', 
    'bajmav-1qojmu-qoKkod', 
    'MPS Ajmer Admin', 
    'SUPER_ADMIN', 
    'ACTIVE', 
    'ALUMNI', 
    1, 
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
),
(
    'superadmin-2', 
    'futurist.raghav@gmail.com', 
    'bajmav-1qojmu-qoKkod', 
    'Raghav (Futurist)', 
    'SUPER_ADMIN', 
    'ACTIVE', 
    'ALUMNI', 
    1, 
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);

-- Adding some sample content to make it look active
INSERT INTO posts (
    id, author_id, content, visibility, category,
    created_at, updated_at
) VALUES 
(
    'post-1', 
    'superadmin-1', 
    'Welcome to the official MPSAJMER CONNECT portal! We are excited to bring our alumni community together.', 
    'public', 
    'announcement',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
),
(
    'post-2', 
    'superadmin-2', 
    'Check out our new mentorship program starting next month. Sign up to be a mentor or mentee!', 
    'public', 
    'general',
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);

-- Adding sample Jobs
INSERT INTO jobs (
    id, posted_by_id, posted_by_name, title, company, location, type, description, 
    salary_range_min, salary_range_max, salary_currency, application_url, is_active, created_at, updated_at
) VALUES 
(
    'job-1', 
    'superadmin-2', 
    'Raghav (Futurist)',
    'Senior Software Engineer', 
    'Google', 
    'Remote', 
    'Full Time', 
    'Looking for experienced engineers to join our cloud team.', 
    150000, 
    200000, 
    'USD',
    'https://careers.google.com', 
    1, 
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);

-- Adding sample Events
INSERT INTO events (
    id, organizer_id, title, description, date, time, location, category, status, created_at, updated_at
) VALUES 
(
    'event-1', 
    'superadmin-1', 
    'MPS Alumni Meet 2026', 
    'Annual gathering of MPS Ajmer alumni. Save the date!', 
    '2026-12-15', 
    '18:00',
    'MPS School Ground, Ajmer', 
    'reunion', 
    'upcoming', 
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), 
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);
