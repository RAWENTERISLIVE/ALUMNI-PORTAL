
-- Add missing columns to users table
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN headline TEXT;
ALTER TABLE users ADD COLUMN profile_image TEXT;
ALTER TABLE users ADD COLUMN city TEXT;
ALTER TABLE users ADD COLUMN country TEXT;
ALTER TABLE users ADD COLUMN company TEXT;
ALTER TABLE users ADD COLUMN job_title TEXT;
ALTER TABLE users ADD COLUMN graduation_year INTEGER;
ALTER TABLE users ADD COLUMN class_year INTEGER;
ALTER TABLE users ADD COLUMN is_available_as_mentor BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN linkedin_profile TEXT;
ALTER TABLE users ADD COLUMN skills TEXT;
ALTER TABLE users ADD COLUMN interests TEXT;
ALTER TABLE users ADD COLUMN updated_at TEXT;
