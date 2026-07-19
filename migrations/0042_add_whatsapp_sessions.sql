
-- Migration 0042: Add WhatsApp Sessions Table for WaSender QR Code Linking
-- This migration creates the table to manage WaSender WhatsApp sessions

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- WaSender Session Details
  session_id VARCHAR(100) UNIQUE NOT NULL, -- WaSender's session identifier
  session_name VARCHAR(100) NOT NULL, -- User-friendly name for the session
  session_token TEXT, -- WaSender session token (encrypted)
  
  -- Connection Status
  status VARCHAR(50) DEFAULT 'disconnected', -- disconnected, connecting, connected, expired, error
  qr_code TEXT, -- Base64 QR code image or URL
  qr_code_expires_at TIMESTAMP,
  
  -- WhatsApp Account Info (once connected)
  whatsapp_number VARCHAR(50), -- Connected WhatsApp number
  whatsapp_name VARCHAR(255), -- Display name from WhatsApp
  whatsapp_profile_picture_url TEXT,
  
  -- Connection Timestamps
  connected_at TIMESTAMP,
  disconnected_at TIMESTAMP,
  last_heartbeat_at TIMESTAMP, -- Last successful ping to verify connection
  
  -- Session Health Monitoring
  health_status VARCHAR(50) DEFAULT 'unknown', -- healthy, degraded, unhealthy
  last_health_check_at TIMESTAMP,
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Error Tracking
  last_error_message TEXT,
  last_error_at TIMESTAMP,
  error_count INTEGER DEFAULT 0,
  
  -- Usage Statistics
  messages_sent_count INTEGER DEFAULT 0,
  last_message_sent_at TIMESTAMP,
  
  -- Session Configuration
  auto_reconnect BOOLEAN DEFAULT TRUE,
  webhook_url TEXT, -- For receiving status updates from WaSender
  
  -- Metadata
  device_info JSONB, -- Device details once connected
  session_metadata JSONB, -- Additional WaSender session data
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(business_id, session_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_business ON whatsapp_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_session_id ON whatsapp_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_health ON whatsapp_sessions(health_status);

-- Comments for documentation
COMMENT ON TABLE whatsapp_sessions IS 'Manages WaSender WhatsApp sessions for QR code linking and connection tracking';
COMMENT ON COLUMN whatsapp_sessions.session_id IS 'Unique session identifier from WaSender API';
COMMENT ON COLUMN whatsapp_sessions.status IS 'Connection status: disconnected, connecting, connected, expired, error';
COMMENT ON COLUMN whatsapp_sessions.qr_code IS 'Base64 encoded QR code for scanning or image URL';
COMMENT ON COLUMN whatsapp_sessions.last_heartbeat_at IS 'Last successful connection verification';
COMMENT ON COLUMN whatsapp_sessions.health_status IS 'Overall health: healthy, degraded, unhealthy';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ WhatsApp Sessions Table Migration Complete';
    RAISE NOTICE 'Created whatsapp_sessions table for WaSender QR code linking';
END $$;
