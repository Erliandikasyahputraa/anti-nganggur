-- ============================================================================
-- JOBHUNT TASKS TABLE & ROW LEVEL SECURITY (RLS) MIGRATION
-- Adds tasks table for tracking job application follow-ups and general search work
-- ============================================================================

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attach reusable updated_at trigger (defined in 001_create_core_tables.sql)
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES FOR PERFORMANCE & DETERMINISTIC QUERY PATHS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_due ON tasks(user_id, status, due_date ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_tasks_application_id ON tasks(application_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Revoke blanket anon access
REVOKE ALL ON tasks FROM anon;

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Users can view only their own tasks
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- 2. INSERT: Users can create their own tasks AND ensure application belongs to user if linked
CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      application_id IS NULL OR
      EXISTS (
        SELECT 1 FROM applications
        WHERE applications.id = tasks.application_id
          AND applications.user_id = auth.uid()
      )
    )
  );

-- 3. UPDATE: Users can update their own tasks AND ensure target application belongs to user if linked
CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND (
      application_id IS NULL OR
      EXISTS (
        SELECT 1 FROM applications
        WHERE applications.id = tasks.application_id
          AND applications.user_id = auth.uid()
      )
    )
  );

-- 4. DELETE: Users can delete only their own tasks
CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Tasks table migration 008 completed successfully at %', NOW();
  RAISE NOTICE 'Configured tasks table with cross-tenant RLS application validation and updated_at trigger';
END $$;
