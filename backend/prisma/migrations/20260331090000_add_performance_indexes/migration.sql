CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "User_status_createdAt_idx" ON "User"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "User_role_createdAt_idx" ON "User"("role", "createdAt");
CREATE INDEX IF NOT EXISTS "User_accountType_status_idx" ON "User"("accountType", "status");
CREATE INDEX IF NOT EXISTS "User_admissionYear_status_idx" ON "User"("admissionYear", "status");

CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX IF NOT EXISTS "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt");
CREATE INDEX IF NOT EXISTS "Post_category_createdAt_idx" ON "Post"("category", "createdAt");
CREATE INDEX IF NOT EXISTS "Post_visibility_createdAt_idx" ON "Post"("visibility", "createdAt");
CREATE INDEX IF NOT EXISTS "Post_isFeatured_createdAt_idx" ON "Post"("isFeatured", "createdAt");
CREATE INDEX IF NOT EXISTS "Post_isSchoolUpdate_createdAt_idx" ON "Post"("isSchoolUpdate", "createdAt");

CREATE INDEX IF NOT EXISTS "PostReaction_userId_postId_type_idx" ON "PostReaction"("userId", "postId", "type");

CREATE INDEX IF NOT EXISTS "Job_createdAt_idx" ON "Job"("createdAt");
CREATE INDEX IF NOT EXISTS "Job_isActive_createdAt_idx" ON "Job"("isActive", "createdAt");
CREATE INDEX IF NOT EXISTS "Job_postedById_createdAt_idx" ON "Job"("postedById", "createdAt");
CREATE INDEX IF NOT EXISTS "Job_type_createdAt_idx" ON "Job"("type", "createdAt");
