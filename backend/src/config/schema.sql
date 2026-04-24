-- =============================================================
--  Dental Clinic Management System — PostgreSQL Schema
--  Version : 1.0
--  Engine  : PostgreSQL 16
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ─────────────────────────────────────────────────────────────
-- 1. Custom ENUM types
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('patient', 'secretary', 'doctor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE dental_condition AS ENUM (
    'crown',
    'cleaning',
    'extraction',
    'braces',
    'rootcanal',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'pending',
    'confirmed',
    'rejected',
    'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. users
--    Stores all accounts (patient / secretary / doctor).
--    Doctor-specific data lives in the doctors table.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           SERIAL        PRIMARY KEY,
  name         VARCHAR(120)  NOT NULL,
  email        VARCHAR(255)  NOT NULL,
  password     VARCHAR(255)  NOT NULL,          -- bcrypt hash
  role         user_role     NOT NULL DEFAULT 'patient',
  phone        VARCHAR(30),
  avatar_url   VARCHAR(500),
  is_active    BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT users_email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  CONSTRAINT users_name_length  CHECK (char_length(name) >= 2)
);

-- Indexes on users
CREATE INDEX IF NOT EXISTS idx_users_email  ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users (role);

-- ─────────────────────────────────────────────────────────────
-- 3. doctors
--    Extends the users table for doctor-specific data.
--    One-to-one with users WHERE role = 'doctor'.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id               SERIAL        PRIMARY KEY,
  user_id          INTEGER       NOT NULL,
  specialization   VARCHAR(120)  NOT NULL,
  bio              TEXT,
  years_experience SMALLINT      DEFAULT 0,
  avatar_url       VARCHAR(500),
  is_available     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT doctors_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT doctors_user_unique UNIQUE (user_id),

  CONSTRAINT doctors_experience_positive
    CHECK (years_experience >= 0)
);

-- Indexes on doctors
CREATE INDEX IF NOT EXISTS idx_doctors_user_id        ON doctors (user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors (specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_available      ON doctors (is_available);

-- ─────────────────────────────────────────────────────────────
-- 4. doctor_availability
--    Weekly availability slots per doctor.
--    day_of_week: 0=Sunday … 6=Saturday
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_availability (
  id            SERIAL      PRIMARY KEY,
  doctor_id     INTEGER     NOT NULL,
  day_of_week   SMALLINT    NOT NULL,   -- 0–6
  start_time    TIME        NOT NULL,   -- e.g. 09:00
  end_time      TIME        NOT NULL,   -- e.g. 17:00
  slot_duration SMALLINT    NOT NULL DEFAULT 30,  -- minutes per slot
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT da_doctor_fk
    FOREIGN KEY (doctor_id) REFERENCES doctors (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT da_day_range   CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT da_time_order  CHECK (end_time > start_time),
  CONSTRAINT da_slot_positive CHECK (slot_duration > 0),

  CONSTRAINT da_doctor_day_unique UNIQUE (doctor_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_da_doctor_id ON doctor_availability (doctor_id);

-- ─────────────────────────────────────────────────────────────
-- 5. appointments
--    Core booking table.  Links patient → doctor, stores
--    condition, chosen slot, status and email-sent flag.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id               SERIAL             PRIMARY KEY,
  patient_id       INTEGER            NOT NULL,
  doctor_id        INTEGER            NOT NULL,
  condition        dental_condition   NOT NULL,
  appointment_date DATE               NOT NULL,
  time_slot        VARCHAR(20)        NOT NULL,   -- e.g. '10:00 AM'
  notes            TEXT,                          -- optional patient notes
  status           appointment_status NOT NULL DEFAULT 'pending',
  email_sent       BOOLEAN            NOT NULL DEFAULT FALSE,
  rejected_reason  TEXT,                          -- secretary rejection note
  confirmed_by     INTEGER,                       -- FK → users(id) secretary
  confirmed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ        NOT NULL DEFAULT NOW(),

  CONSTRAINT appt_patient_fk
    FOREIGN KEY (patient_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT appt_doctor_fk
    FOREIGN KEY (doctor_id) REFERENCES doctors (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT appt_confirmed_by_fk
    FOREIGN KEY (confirmed_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  -- Prevent double-booking: same doctor, same date, same time slot
  CONSTRAINT appt_no_double_book
    UNIQUE (doctor_id, appointment_date, time_slot),

  CONSTRAINT appt_date_not_past
    CHECK (appointment_date >= CURRENT_DATE),

  CONSTRAINT appt_email_requires_confirmed
    CHECK (
      (email_sent = FALSE)
      OR (email_sent = TRUE AND status = 'confirmed')
    )
);

-- Indexes on appointments
CREATE INDEX IF NOT EXISTS idx_appt_patient_id ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_doctor_id  ON appointments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_appt_status     ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appt_date       ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_patient_status
  ON appointments (patient_id, status);
CREATE INDEX IF NOT EXISTS idx_appt_doctor_date
  ON appointments (doctor_id, appointment_date);

-- ─────────────────────────────────────────────────────────────
-- 6. Automatic updated_at trigger
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that have updated_at
DO $$ BEGIN
  CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_doctors
    BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_appointments
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- 7. Seed — dental condition reference (informational)
-- ─────────────────────────────────────────────────────────────
-- No separate lookup table needed: the ENUM enforces values.
-- Labels shown in UI are handled in frontend constants.js.

-- ─────────────────────────────────────────────────────────────
-- 8. Views (convenience)
-- ─────────────────────────────────────────────────────────────

-- Secretary dashboard view: appointments with patient + doctor names
CREATE OR REPLACE VIEW vw_appointments_full AS
SELECT
  a.id,
  a.appointment_date,
  a.time_slot,
  a.condition,
  a.status,
  a.email_sent,
  a.notes,
  a.rejected_reason,
  a.confirmed_at,
  a.created_at,
  -- Patient
  u_pat.id        AS patient_id,
  u_pat.name      AS patient_name,
  u_pat.email     AS patient_email,
  u_pat.phone     AS patient_phone,
  -- Doctor
  d.id            AS doctor_id,
  u_doc.name      AS doctor_name,
  d.specialization,
  -- Confirmed by
  u_sec.name      AS confirmed_by_name
FROM appointments a
JOIN users  u_pat ON u_pat.id  = a.patient_id
JOIN doctors d    ON d.id      = a.doctor_id
JOIN users  u_doc ON u_doc.id  = d.user_id
LEFT JOIN users u_sec ON u_sec.id = a.confirmed_by;

-- Doctor schedule view: doctor's own appointments with patient info
CREATE OR REPLACE VIEW vw_doctor_schedule AS
SELECT
  a.id,
  a.appointment_date,
  a.time_slot,
  a.condition,
  a.status,
  a.notes,
  d.id            AS doctor_id,
  u_pat.name      AS patient_name,
  u_pat.phone     AS patient_phone,
  u_pat.email     AS patient_email
FROM appointments a
JOIN doctors d    ON d.id     = a.doctor_id
JOIN users u_pat  ON u_pat.id = a.patient_id
WHERE a.status IN ('confirmed', 'completed');
