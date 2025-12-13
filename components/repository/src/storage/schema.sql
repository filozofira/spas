-- SPAS Repository Service Database Schema
-- SQLite with JSON support for PoC implementation
-- Easily migrates to PostgreSQL JSONB for production

-- Services table: Stores service metadata
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  version TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  bounded_context TEXT NOT NULL,
  capabilities TEXT NOT NULL, -- JSON array stored as TEXT
  metadata JSON NOT NULL, -- Full runtime metadata (design-time + runtime fields)
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(service_id, version),
  CHECK(json_valid(metadata)),
  CHECK(json_valid(capabilities))
);

-- Schemas table: Stores service schemas (event, internal, endpoint)
CREATE TABLE IF NOT EXISTS schemas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  service_version TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('event', 'internal', 'endpoint')),
  content JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(service_id, service_version, name),
  FOREIGN KEY(service_id, service_version) REFERENCES services(service_id, version) ON DELETE CASCADE,
  CHECK(json_valid(content))
);

-- Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_services_service_id ON services(service_id);
CREATE INDEX IF NOT EXISTS idx_services_bounded_context ON services(bounded_context);
CREATE INDEX IF NOT EXISTS idx_schemas_service ON schemas(service_id, service_version);
CREATE INDEX IF NOT EXISTS idx_schemas_type ON schemas(type);
