-- Migration: Add status field to clients table
-- This script adds a status field to track active/closed client status

-- Add status column to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed'));

-- Update existing clients to have 'active' status by default
UPDATE clients 
SET status = 'active' 
WHERE status IS NULL;

-- Add index for better query performance on status filtering
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_user_status ON clients(user_id, status);

-- Update the updated_at timestamp for modified records
UPDATE clients SET updated_at = NOW() WHERE status = 'active';