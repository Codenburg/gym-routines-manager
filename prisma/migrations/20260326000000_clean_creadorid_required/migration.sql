-- Clean migration: make creadorId required, remove legacy creador field
-- All existing rutinas are deleted to ensure clean state with required FK

BEGIN;

-- Step 1: Delete all existing rutinas (cascade deletes dias and ejercicios)
-- This ensures no NULL creadorId issues and fresh start
DELETE FROM "Rutina";

-- Step 2: Drop existing FK constraint
ALTER TABLE "Rutina" DROP CONSTRAINT IF EXISTS "Rutina_creadorId_fkey";

-- Step 3: Drop legacy creador column (TEXT)
ALTER TABLE "Rutina" DROP COLUMN IF EXISTS "creador";

-- Step 4: Alter creadorId to be NOT NULL and re-add FK with CASCADE
ALTER TABLE "Rutina" ALTER COLUMN "creadorId" SET NOT NULL;
ALTER TABLE "Rutina" ADD CONSTRAINT "Rutina_creadorId_fkey" 
    FOREIGN KEY ("creadorId") REFERENCES "User"("id") ON DELETE CASCADE;

COMMIT;
