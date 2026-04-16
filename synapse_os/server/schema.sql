-- Create the competitors table
CREATE TABLE IF NOT EXISTS competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    scraped_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mongo_id TEXT, -- Optional: to keep a reference to the original MongoDB ID
    is_primary BOOLEAN DEFAULT FALSE
);

-- Create an index on the name field for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitors_name ON competitors(name);

-- Create the generated_videos table for HeyGen video storage
CREATE TABLE IF NOT EXISTS generated_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id TEXT NOT NULL,
    video_url TEXT NOT NULL,
    topic TEXT,
    platform TEXT,
    tone TEXT,
    cta TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on video_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_generated_videos_video_id ON generated_videos(video_id);

-- Create the linkedin_competitors table
CREATE TABLE IF NOT EXISTS linkedin_competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    scraped_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    mongo_id TEXT,
    is_primary BOOLEAN DEFAULT FALSE
);

-- Create an index on the name field for faster lookups
CREATE INDEX IF NOT EXISTS idx_linkedin_competitors_name ON linkedin_competitors(name);

-- Create the knowledge_base_files table for Knowledge Hub
CREATE TABLE IF NOT EXISTS knowledge_base_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'document', -- 'document', 'link', 'guideline'
    file_format TEXT, -- 'pdf', 'docx', 'txt', 'md', 'url', 'image'
    file_size INTEGER,
    url TEXT, -- for links or stored file URL
    description TEXT,
    status TEXT DEFAULT 'processing', -- 'processing', 'active', 'failed'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for the knowledge_base_files table
CREATE INDEX IF NOT EXISTS idx_knowledge_base_files_type ON knowledge_base_files(file_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_files_status ON knowledge_base_files(status);
