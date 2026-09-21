-- Integrity constraints that the hosted project's own history added.
--
-- Reconstructed from the live database so a database rebuilt from this migration
-- set enforces the same invariants the hosted project does. The original file for
-- this version is not in the repository; only the constraints it installed are
-- reproduced here, and each one is guarded so the migration is safe on a database
-- that already has it.
--
-- Note: a share may never expire before it was created. Fixtures that need an
-- already-expired share must therefore backdate `created_at` as well.

ALTER TABLE public.shared_sessions
    DROP CONSTRAINT IF EXISTS check_shared_sessions_expiry_after_creation;
ALTER TABLE public.shared_sessions
    ADD CONSTRAINT check_shared_sessions_expiry_after_creation
    CHECK (expires_at IS NULL OR created_at IS NULL OR expires_at >= created_at);

-- The hosted `sessions` table carries a `scopes` column that the checked-in schema
-- does not define, so this constraint is only applied where that column exists.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'sessions'
          AND column_name = 'scopes'
    ) THEN
        ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_scopes_length;
        ALTER TABLE public.sessions
            ADD CONSTRAINT sessions_scopes_length CHECK (char_length(scopes) <= 4096);
    END IF;
END $$;
