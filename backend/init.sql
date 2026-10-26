-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Biomechanical Knowledge Base Table
CREATE TABLE IF NOT EXISTS biomechanical_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    target_muscle VARCHAR(100) NOT NULL,
    movement_plane VARCHAR(50) NOT NULL,
    joint_stress VARCHAR(100) NOT NULL,
    axial_loading BOOLEAN DEFAULT false,
    description TEXT,
    embedding vector(768)
);

-- Index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS biomechanical_exercises_embedding_idx 
ON biomechanical_exercises 
USING hnsw (embedding vector_cosine_ops);
