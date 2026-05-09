
-- Migration: Create job_applications table
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS job_applications (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    applicant_id TEXT NOT NULL,
    cover_letter TEXT,
    resume_url TEXT,
    resume_filename TEXT,
    portfolio_url TEXT,
    status TEXT DEFAULT 'pending', -- pending, reviewed, interview, rejected, hired
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(job_id, applicant_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_id);
