-- Migration: Convert User.id, Session.userId, Account.userId to UUID and create FK for Rutina.creadorId
-- All tables already store valid UUIDs, just need to change column types

BEGIN;

-- Step 1: Drop existing FK constraints that reference User.id
ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE "Account" DROP CONSTRAINT IF EXISTS "Account_userId_fkey";
ALTER TABLE "Rutina" DROP CONSTRAINT IF EXISTS "Rutina_creadorId_fkey";

-- Step 2: Convert Session.userId to UUID
ALTER TABLE "Session" ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;

-- Step 3: Convert Account.userId to UUID
ALTER TABLE "Account" ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;

-- Step 4: Convert User.id to UUID (must be done after Session/Account because they reference it)
ALTER TABLE "User" ALTER COLUMN "id" TYPE uuid USING "id"::uuid;

-- Step 5: Convert Rutina.creadorId to UUID (already done in previous migration but re-confirm)
ALTER TABLE "Rutina" ALTER COLUMN "creadorId" TYPE uuid USING "creadorId"::uuid;

-- Step 6: Recreate FK constraints
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_creadorId_fkey" 
    FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE SET NULL;

COMMIT;
