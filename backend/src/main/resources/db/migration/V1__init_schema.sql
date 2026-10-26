-- Baseline schema for the Strength & Biomechanics Engine.
-- Flyway owns the schema; Hibernate runs with ddl-auto=validate/none.

CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    goal          VARCHAR(30)  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL
);

-- ---------------------------------------------------------------------------
-- Training domain
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workouts (
    id                   UUID PRIMARY KEY,
    user_id              VARCHAR(255) NOT NULL,
    title                VARCHAR(255) NOT NULL,
    description          TEXT,
    start_time           TIMESTAMPTZ  NOT NULL,
    end_time             TIMESTAMPTZ,
    duration_seconds     BIGINT,
    total_volume_kg      DOUBLE PRECISION,
    completed_sets_count INTEGER
);

CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts (user_id);

CREATE TABLE IF NOT EXISTS workout_exercises (
    id                   UUID PRIMARY KEY,
    exercise_template_id VARCHAR(255) NOT NULL,
    title                VARCHAR(255) NOT NULL,
    brand                VARCHAR(255),
    muscle_group         VARCHAR(100) NOT NULL,
    equipment_category   VARCHAR(100),
    image_url            VARCHAR(500),
    workout_id           UUID REFERENCES workouts (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS workout_exercises_workout_id_idx ON workout_exercises (workout_id);

CREATE TABLE IF NOT EXISTS workout_sets (
    id                  UUID PRIMARY KEY,
    set_index           INTEGER     NOT NULL,
    set_type            VARCHAR(30) NOT NULL,
    weight_kg           NUMERIC(6, 2),
    reps                INTEGER     NOT NULL,
    rpe                 NUMERIC(3, 1),
    is_completed        BOOLEAN     NOT NULL,
    workout_exercise_id UUID REFERENCES workout_exercises (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS workout_sets_workout_exercise_id_idx ON workout_sets (workout_exercise_id);

CREATE TABLE IF NOT EXISTS body_measurements (
    id               UUID PRIMARY KEY,
    user_id          VARCHAR(255) NOT NULL,
    measurement_date DATE         NOT NULL,
    weight_kg        NUMERIC(5, 2) NOT NULL,
    chest_cm         NUMERIC(5, 2),
    waist_cm         NUMERIC(5, 2),
    arm_cm           NUMERIC(5, 2),
    thigh_cm         NUMERIC(5, 2),
    notes            TEXT
);

CREATE INDEX IF NOT EXISTS body_measurements_user_id_idx ON body_measurements (user_id);

-- ---------------------------------------------------------------------------
-- Vector knowledge base
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS biomechanical_exercises (
    id             UUID PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    brand          VARCHAR(255),
    target_muscle  VARCHAR(100) NOT NULL,
    movement_plane VARCHAR(100) NOT NULL,
    joint_stress   VARCHAR(100) NOT NULL,
    axial_loading  BOOLEAN      NOT NULL DEFAULT false,
    description    TEXT,
    embedding      vector(768)
);

CREATE INDEX IF NOT EXISTS biomechanical_exercises_target_muscle_idx
    ON biomechanical_exercises (target_muscle);

-- HNSW index for cosine distance (<=>) lookups.
CREATE INDEX IF NOT EXISTS biomechanical_exercises_embedding_idx
    ON biomechanical_exercises
    USING hnsw (embedding vector_cosine_ops);
