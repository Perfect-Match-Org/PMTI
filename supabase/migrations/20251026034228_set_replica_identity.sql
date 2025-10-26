-- Set REPLICA IDENTITY FULL for real-time tables
-- This ensures PostgreSQL replicates full row data (including JSONB columns)
-- for Supabase Realtime, preventing "mismatch between server and client bindings" errors

-- Enable full row replication for surveys table
-- Required for tracking participant_status JSONB changes in real-time
ALTER TABLE surveys REPLICA IDENTITY FULL;

-- Enable full row replication for invitations table
-- Required for tracking invitation status changes in real-time
ALTER TABLE invitations REPLICA IDENTITY FULL;

-- Enable Supabase Realtime for these tables
-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE surveys;
ALTER PUBLICATION supabase_realtime ADD TABLE invitations;

-- Add comments for documentation
COMMENT ON TABLE surveys IS 'REPLICA IDENTITY FULL - Realtime tracking of participant_status and survey progression';
COMMENT ON TABLE invitations IS 'REPLICA IDENTITY FULL - Realtime tracking of invitation status changes';
