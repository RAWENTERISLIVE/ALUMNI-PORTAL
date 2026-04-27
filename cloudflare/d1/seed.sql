
-- Seed superadmin users
INSERT OR IGNORE INTO users (id, email, name, password_hash, role, created_at) VALUES 
('admin-1', 'mpsajmer123@gmail.com', 'MPS AJMER ADMIN', '$2a$10$CQKasBLfC0Bwm93oEen./.Pn/X/vWSqWW1hqjMOYR8pSj1K/a34r.', 'SUPERADMIN', CURRENT_TIMESTAMP),
('admin-2', 'futurist.raghav@gmail.com', 'Raghav Agarwal', '$2a$10$CQKasBLfC0Bwm93oEen./.Pn/X/vWSqWW1hqjMOYR8pSj1K/a34r.', 'SUPERADMIN', CURRENT_TIMESTAMP);
