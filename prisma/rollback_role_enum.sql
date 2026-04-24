-- Rollback migration for add_role_enum
-- This script reverts the User table from Role enum back to admin Boolean

BEGIN;

-- Add admin boolean column (default false for existing users)
ALTER TABLE "User" ADD COLUMN "admin" BOOLEAN NOT NULL DEFAULT false;

-- Migrate role data back to admin column
UPDATE "User" SET "admin" = true WHERE "role" = 'ADMIN';
UPDATE "User" SET "admin" = false WHERE "role" = 'TRAINER';
UPDATE "User" SET "admin" = false WHERE "role" = 'USER';

-- Drop the role column
ALTER TABLE "User" DROP COLUMN "role";

-- Drop the Role enum type
DROP TYPE "Role";

COMMIT;
