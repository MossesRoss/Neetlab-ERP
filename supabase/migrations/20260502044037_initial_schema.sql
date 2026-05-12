-- =================================================================================
-- NEETLAB INTERNAL ERP: Standalone Schema
-- =================================================================================

-- =================================================================================
-- 1. SYLLABUS HIERARCHY (Class -> Subject -> Chapter -> Topic)
-- We need this to catalog what we are tracking and building.
-- =================================================================================
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE -- e.g., 'Class 11', 'Class 12', 'Dropper'
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- e.g., 'Physics', 'Chemistry', 'Biology'
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE
);

-- =================================================================================
-- 2. SIMULATION CATALOG
-- The master list of all simulations our Dev team has built.
-- =================================================================================
CREATE TABLE simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,   -- We will use this URL to match incoming tracking data!
    status TEXT DEFAULT 'LIVE', -- LIVE, IN_DEVELOPMENT, DEPRECATED
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================================
-- 3. ERP INTERNAL USERS
-- Strictly for your team (Devs, PMs, Student Success). Not for external students.
-- =================================================================================
CREATE TABLE erp_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'ADMIN', 'DEVELOPER', 'STUDENT_SUCCESS', 'TEACHER'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================================
-- 4. DEV & CONTENT TASKS (Jira/Trello Replacement)
-- =================================================================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'TODO', -- 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'
    type TEXT DEFAULT 'BUG',    -- 'BUG', 'FEATURE', 'CONTENT_REVIEW'
    
    -- We link tasks directly to our internal simulation catalog
    simulation_id UUID REFERENCES simulations(id) ON DELETE SET NULL, 
    
    assignee_id UUID REFERENCES erp_users(id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES erp_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================================
-- 5. TELEMETRY INGESTION (The "Google Tag" Sink)
-- This is where the injected code snippet sends its data.
-- =================================================================================
CREATE TABLE tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The injected script will generate an anonymous session cookie in the student's browser
    -- so we can track "Time Spent" without needing to know who they are.
    session_id TEXT NOT NULL, 
    
    -- The URL where the event happened. We can join this against simulations.url later.
    page_url TEXT NOT NULL,   
    
    -- e.g., 'page_view', 'heartbeat' (every 10s they are active), 'click', 'completion'
    event_type TEXT NOT NULL, 
    
    -- Flexible JSON payload for things like { "clicked_element": "next_button", "score": 80 }
    event_data JSONB,         
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster analytics querying by URL and Event Type
CREATE INDEX idx_tracking_url ON tracking_events(page_url);
CREATE INDEX idx_tracking_type ON tracking_events(event_type);