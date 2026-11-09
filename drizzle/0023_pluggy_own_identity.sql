CREATE TABLE pluggy_settings (
 id TEXT PRIMARY KEY NOT NULL,
 owner_names TEXT NOT NULL CHECK (owner_names LIKE 'pfc:v2:%'),
 owner_cpf TEXT CHECK (owner_cpf IS NULL OR owner_cpf LIKE 'pfc:v2:%'),
 other_own_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
 created_at TEXT NOT NULL CHECK (created_at LIKE 'pfc:v2:%'),
 updated_at TEXT NOT NULL CHECK (updated_at LIKE 'pfc:v2:%')
);
