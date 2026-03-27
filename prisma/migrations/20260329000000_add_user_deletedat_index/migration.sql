-- Add index on User.deletedAt for soft-delete query performance

CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");
