-- Create the competitors table
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    scraped_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mongo_id TEXT -- Optional: to keep a reference to the original MongoDB ID
);

-- Create an index on the name field for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitors_name ON competitors(name);
