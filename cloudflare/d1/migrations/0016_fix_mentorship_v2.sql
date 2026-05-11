-- Migration to fix mentorship schema and add reviews
CREATE TABLE IF NOT EXISTS mentorship_reviews (
    id TEXT PRIMARY KEY,
    mentor_profile_id TEXT NOT NULL,
    mentee_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (mentor_profile_id) REFERENCES mentorship_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (mentee_id) REFERENCES users(id) ON DELETE CASCADE
);
