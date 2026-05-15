CREATE TABLE IF NOT EXISTS access_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'unused',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    used_at TEXT,
    redbook_username TEXT,
    result_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes (code);
CREATE INDEX IF NOT EXISTS idx_access_codes_status ON access_codes (status);

CREATE TABLE IF NOT EXISTS test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    redbook_username TEXT NOT NULL,
    phone TEXT,
    code TEXT NOT NULL,
    result_type TEXT NOT NULL,
    scores_json TEXT NOT NULL,
    crystal_name TEXT NOT NULL,
    crystal_color TEXT NOT NULL,
    crystal_reason TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (code) REFERENCES access_codes (code)
);

CREATE INDEX IF NOT EXISTS idx_test_results_code ON test_results (code);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results (created_at);
