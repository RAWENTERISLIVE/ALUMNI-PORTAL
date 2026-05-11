-- Migration to enhance groups functionality
-- Add image_url to groups
ALTER TABLE groups ADD COLUMN image_url TEXT;

-- Add role to group_members to support multiple admins/moderators
ALTER TABLE group_members ADD COLUMN role TEXT DEFAULT 'MEMBER' CHECK(role IN ('MEMBER', 'ADMIN', 'MODERATOR'));

-- Initialize role for existing creators as ADMIN
-- Note: SQLite doesn't support complex JOINs in UPDATE easily across all versions, 
-- but we can use a subquery.
UPDATE group_members 
SET role = 'ADMIN' 
WHERE EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = group_members.group_id 
    AND groups.creator_id = group_members.user_id
);
