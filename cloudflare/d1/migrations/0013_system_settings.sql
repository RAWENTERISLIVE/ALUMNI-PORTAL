-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings if they don't exist
-- We'll store the entire settings object as a JSON string under the key 'global_settings'
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('global_settings', '{}');
