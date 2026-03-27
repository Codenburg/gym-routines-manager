-- Change FK from CASCADE to RESTRICT to prevent implicit deletion of rutinas
-- Transfer ownership before deleting users is now required at application level

BEGIN;

-- Step 1: Drop existing FK constraint with CASCADE
ALTER TABLE "Rutina" DROP CONSTRAINT IF EXISTS "Rutina_creadorId_fkey";

-- Step 2: Create new FK with RESTRICT (blocks deletion of user if rutinas exist)
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_creadorId_fkey" 
    FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE RESTRICT;

-- Step 3: Ensure index exists (idempotent)
CREATE INDEX IF NOT EXISTS "Rutina_creadorId_idx" ON "Rutina"("creadorId");

COMMIT;
