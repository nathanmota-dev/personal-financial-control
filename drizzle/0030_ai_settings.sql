CREATE TABLE ai_settings (
 id TEXT PRIMARY KEY NOT NULL,
 provider TEXT NOT NULL CHECK (provider LIKE 'pfc:v2:%'),
 model TEXT NOT NULL CHECK (model LIKE 'pfc:v2:%'),
 api_key TEXT NOT NULL CHECK (api_key LIKE 'pfc:v2:%'),
 created_at TEXT NOT NULL CHECK (created_at LIKE 'pfc:v2:%'),
 updated_at TEXT NOT NULL CHECK (updated_at LIKE 'pfc:v2:%')
);
