-- Drop existing creadorId column if it exists (created in previous partial migration attempt)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Rutina' AND column_name = 'creadorId') THEN
        ALTER TABLE "Rutina" DROP COLUMN "creadorId";
    END IF;
END $$;

-- Add FK column creadorId to Rutina as TEXT to match Prisma schema (String type)
ALTER TABLE "Rutina" ADD COLUMN "creadorId" TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS "Rutina_creadorId_idx" ON "Rutina"("creadorId");

-- Backfill: Populate creadorId based on matching User.name = Rutina.creador
-- Uses name match because creator stored creator's name, not ID
UPDATE "Rutina" r
SET "creadorId" = u.id::TEXT
FROM "User" u
WHERE r."creador" = u.name AND r."creadorId" IS NULL;

-- NOTE: FK constraint is NOT created here because the database has User.id as UUID
-- but Prisma schema uses String. The relation is enforced at Prisma level.
-- To add FK manually later:
-- ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_creadorId_fkey" 
--     FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE SET NULL;
