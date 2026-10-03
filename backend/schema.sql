-- LOCO Location Assessment Tool Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Assessments Table
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label VARCHAR(255) NOT NULL,
    address TEXT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    total_score DOUBLE PRECISION NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assessment Factors Table
CREATE TABLE IF NOT EXISTS assessment_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    factor_name VARCHAR(255) NOT NULL,
    raw_value TEXT NULL,
    points DOUBLE PRECISION NULL,
    max_points DOUBLE PRECISION NOT NULL,
    source VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster joins
CREATE INDEX IF NOT EXISTS idx_assessment_factors_assessment_id ON assessment_factors(assessment_id);
