-- Migration: User soft delete, OwnershipTransfer audit table, unique routine name per user
-- This migration ADDS columns/tables/indexes without losing existing data

BEGIN;

-- Step 1: Add deletedAt column to User table (soft delete - nullable timestamp)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

-- Step 2: Create OwnershipTransfer table for audit trail
-- Note: Uses TEXT for rutinaId since Rutina.id is TEXT not UUID
CREATE TABLE IF NOT EXISTS "OwnershipTransfer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rutinaId" TEXT NOT NULL,
    "fromUserId" UUID,
    "toUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "OwnershipTransfer_pkey" PRIMARY KEY ("id")
);

-- Step 3: Add FK from OwnershipTransfer to Rutina (cascade on delete)
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_rutinaId_fkey"
    FOREIGN KEY ("rutinaId") REFERENCES "Rutina"("id") ON DELETE CASCADE;

-- Step 4: Add FK from OwnershipTransfer to User (fromUser) - SET NULL on delete
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_fromUserId_fkey"
    FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL;

-- Step 5: Add FK from OwnershipTransfer to User (toUser) - CASCADE on delete
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_toUserId_fkey"
    FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE;

-- Step 6: Create unique index on (creadorId, nombre) to prevent duplicate routine names per user
-- IF NOT EXISTS is not supported for UNIQUE indexes in PostgreSQL, so we use DO block
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'Rutina_creadorId_nombre_unique'
    ) THEN
        CREATE UNIQUE INDEX "Rutina_creadorId_nombre_unique" ON "Rutina"("creadorId", "nombre");
    END IF;
END $$;

-- Step 7: Create indexes for OwnershipTransfer lookups
CREATE INDEX IF NOT EXISTS "OwnershipTransfer_rutinaId_idx" ON "OwnershipTransfer"("rutinaId");
CREATE INDEX IF NOT EXISTS "OwnershipTransfer_fromUserId_idx" ON "OwnershipTransfer"("fromUserId");
CREATE INDEX IF NOT EXISTS "OwnershipTransfer_toUserId_idx" ON "OwnershipTransfer"("toUserId");

COMMIT;
