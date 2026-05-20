CREATE TABLE technologies (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
category VARCHAR(100) NOT NULL,
complexity_weight INTEGER NOT NULL
CHECK(complexity_weight BETWEEN 1 AND 10),
description TEXT DEFAULT '',
best_for TEXT DEFAULT '',
risk_notes TEXT DEFAULT '',
alternatives TEXT DEFAULT '',
docs_url TEXT DEFAULT '',
is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE users(
id SERIAL PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
password_hash VARCHAR(255) NOT NULL,
role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects(
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
name TEXT NOT NULL,
daily_users INTEGER NOT NULL CHECK (daily_users>=0),
scale VARCHAR(20) NOT NULL CHECK(scale IN ('Personal', 'Startup', 'Enterprise')),
visibility VARCHAR(10) DEFAULT 'private' CHECK(visibility IN ('private', 'public')),
created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_technologies(
id SERIAL PRIMARY KEY,
project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
technology_id INTEGER REFERENCES technologies(id) ON DELETE CASCADE,
UNIQUE(project_id, technology_id)
);

CREATE TABLE analysis_results(
id SERIAL PRIMARY KEY,
project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
total_score INTEGER NOT NULL,
frontend_score INTEGER NOT NULL DEFAULT 0,
backend_score INTEGER NOT NULL DEFAULT 0,
infrastructure_score INTEGER NOT NULL DEFAULT 0,
evaluation TEXT NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analysis_flags(
id SERIAL PRIMARY KEY,
analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
flag_name VARCHAR(100) NOT NULL,
severity VARCHAR(10) NOT NULL
);


CREATE TABLE recommendations (
id SERIAL PRIMARY KEY,
analysis_id INTEGER REFERENCES analysis_results(id) ON DELETE CASCADE,
recommendation_text TEXT NOT NULL
);
