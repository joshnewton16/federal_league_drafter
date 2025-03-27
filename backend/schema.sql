-- Fantasy Baseball Draft PostgreSQL Schema

-- Teams table
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    owner VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    logo_url TEXT,
    draft_position INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Players table
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    mlb_id INTEGER,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(10) NOT NULL,
    position_name VARCHAR(50),
    mlb_team VARCHAR(100),
    mlb_team_id INTEGER,
    number VARCHAR(10),
    bats CHAR(1),
    throws CHAR(1),
    birth_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    is_minor_league BOOLEAN DEFAULT FALSE,
    fantasy_team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'Available',
    rating NUMERIC(3,1),
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Draft picks table
CREATE TABLE draft_picks (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_name VARCHAR(100) NOT NULL,
    position VARCHAR(10) NOT NULL,
    mlb_team VARCHAR(100),
    pick_number INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

-- Create indexes for common queries
CREATE INDEX idx_players_mlb_id ON players(mlb_id);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_mlb_team ON players(mlb_team);
CREATE INDEX idx_players_fantasy_team_id ON players(fantasy_team_id);
CREATE INDEX idx_draft_picks_team_id ON draft_picks(team_id);
CREATE INDEX idx_draft_picks_player_id ON draft_picks(player_id);
CREATE INDEX idx_draft_picks_pick_number ON draft_picks(pick_number);

-- Sample data for testing
INSERT INTO teams (name, owner, email, created_at, updated_at)
VALUES 
    ('Mighty Dragons', 'John Smith', 'john@example.com', NOW(), NOW()),
    ('Thundering Knights', 'Sarah Johnson', 'sarah@example.com', NOW(), NOW()),
    ('Blazing Eagles', 'Mike Williams', 'mike@example.com', NOW(), NOW()),
    ('Crushing Bears', 'Lisa Brown', 'lisa@example.com', NOW(), NOW());